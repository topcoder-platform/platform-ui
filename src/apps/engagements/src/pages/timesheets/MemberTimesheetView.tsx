import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import { Button, InputDatePicker } from '~/libs/ui'

import type { TimesheetView } from '../../lib/models'
import { TimesheetEntryStatus } from '../../lib/models'
import {
    saveTimesheetEntries,
    submitTimesheetEntries,
} from '../../lib/services'
import type { TimesheetRow } from '../../lib/utils'
import {
    buildTimesheetRows,
    formatHoursLabel,
    hasEnteredHours,
    isRowReadOnly,
    sumSelectedTotals,
    toWorkDateString,
    validateDateRange,
    validateHours,
} from '../../lib/utils'
import { TimesheetGrid } from '../../components/timesheet-grid'
import { TimesheetSubmitModal } from '../../components/timesheet-submit-modal'

import styles from './TimesheetsPage.module.scss'

interface MemberTimesheetViewProps {
    timesheet: TimesheetView
    /** Replaces the loaded timesheet after a save or submit returns the refreshed view. */
    onTimesheetChange: (timesheet: TimesheetView) => void
    /** Reports whether the view holds unsaved edits, so the page can guard navigation. */
    onDirtyChange: (isDirty: boolean) => void
}

const extractErrorMessage = (error: unknown, fallback: string): string => {
    const typedError = error as {
        message?: string
        response?: { data?: { message?: string } }
    }

    return typedError?.response?.data?.message || typedError?.message || fallback
}

/** Default range: the current working week, Monday through Friday, as the common thing to fill in. */
const getDefaultRange = (): { fromDate: string, toDate: string } => {
    const today = new Date()
    const monday = new Date(today)
    const offsetToMonday = (today.getDay() + 6) % 7
    monday.setDate(today.getDate() - offsetToMonday)
    const friday = new Date(monday)
    friday.setDate(monday.getDate() + 4)

    return {
        fromDate: toWorkDateString(monday),
        toDate: toWorkDateString(friday),
    }
}

const toPickerDate = (value: string): Date | undefined => {
    if (!value) {
        return undefined
    }

    const [year, month, day] = value.split('-')
        .map(Number)

    return new Date(year, month - 1, day)
}

/**
 * The member's timesheet: pick a range, enter hours, submit.
 *
 * Rows for the picked range are generated here in the browser and only the days with hours are ever
 * saved. That is why a row can exist on screen with no `id` behind it - browsing a month must not
 * create thirty empty drafts on the server.
 *
 * The grid and modal are imported from their own folders rather than the components barrel, which also
 * pulls in the markdown-rendering cards this view has no use for.
 */
const MemberTimesheetView: FC<MemberTimesheetViewProps> = (props: MemberTimesheetViewProps) => {
    const defaultRange = useMemo(getDefaultRange, [])
    const [fromDate, setFromDate] = useState<string>(defaultRange.fromDate)
    const [toDate, setToDate] = useState<string>(defaultRange.toDate)
    const [rows, setRows] = useState<TimesheetRow[]>([])
    const [selectedDates, setSelectedDates] = useState<string[]>([])
    const [isDirty, setIsDirty] = useState<boolean>(false)
    const [isSaving, setIsSaving] = useState<boolean>(false)
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false)
    const [actionError, setActionError] = useState<string | undefined>()

    const rangeError = validateDateRange(fromDate, toDate)
    const standardHoursPerDay = props.timesheet.assignment.standardHoursPerDay

    // Regenerate the grid whenever the range or the saved entries change, merging saved values in so
    // the member sees their own hours rather than a blank duplicate.
    useEffect(() => {
        if (rangeError) {
            return
        }

        setRows(buildTimesheetRows(fromDate, toDate, props.timesheet.entries))
        setSelectedDates([])
        setIsDirty(false)
    }, [fromDate, props.timesheet.entries, rangeError, toDate])

    useEffect(() => {
        props.onDirtyChange(isDirty)
    }, [isDirty, props])

    const selectedRows = useMemo(
        () => rows.filter(row => selectedDates.includes(row.workDate)),
        [rows, selectedDates],
    )
    const totals = useMemo(() => sumSelectedTotals(selectedRows), [selectedRows])

    const handleRowChange = useCallback((workDate: string, changes: Partial<TimesheetRow>) => {
        setRows(current => current.map(row => (
            row.workDate === workDate ? { ...row, ...changes } : row
        )))
        setIsDirty(true)
        setActionError(undefined)
    }, [])

    /** Saves every row the member has filled in, not only the selected ones. */
    const buildSavePayload = useCallback(() => (
        rows
            .filter(row => !isRowReadOnly(row))
            .filter(row => hasEnteredHours(row) || Boolean(row.id))
            .filter(row => !validateHours(row.hoursWorked, standardHoursPerDay).error)
            .filter(row => hasEnteredHours(row))
            .map(row => ({
                hoursWorked: row.hoursWorked.trim(),
                remarks: row.remarks.trim() || undefined,
                workDate: row.workDate,
            }))
    ), [rows, standardHoursPerDay])

    const invalidRows = useMemo(
        () => rows.filter(row => (
            !isRowReadOnly(row)
            && Boolean(validateHours(row.hoursWorked, standardHoursPerDay).error)
        )),
        [rows, standardHoursPerDay],
    )

    const handleSave = useCallback(async () => {
        if (invalidRows.length) {
            setActionError('Fix the highlighted hours before saving.')
            return
        }

        const entries = buildSavePayload()
        if (!entries.length) {
            setActionError('Enter hours on at least one day before saving.')
            return
        }

        setActionError(undefined)
        setIsSaving(true)

        try {
            const updated = await saveTimesheetEntries(
                props.timesheet.engagementId,
                props.timesheet.assignment.id,
                { entries },
            )
            props.onTimesheetChange(updated)
            setIsDirty(false)
            toast.success('Timesheet saved.')
        } catch (error) {
            setActionError(extractErrorMessage(error, 'Failed to save the timesheet.'))
        } finally {
            setIsSaving(false)
        }
    }, [buildSavePayload, invalidRows.length, props])

    const handleSubmit = useCallback(async () => {
        setActionError(undefined)
        setIsSubmitting(true)

        try {
            // Save first: a selected row may hold edits, or may never have been saved at all, and the
            // submit endpoint works on entry ids.
            const entries = buildSavePayload()
            let current = props.timesheet

            if (entries.length) {
                current = await saveTimesheetEntries(
                    current.engagementId,
                    current.assignment.id,
                    { entries },
                )
            }

            const entryIds = current.entries
                .filter(entry => selectedDates.includes(entry.workDate))
                .filter(entry => entry.status === TimesheetEntryStatus.DRAFT)
                .map(entry => entry.id)

            if (!entryIds.length) {
                setActionError('The selected rows have nothing to submit.')
                return
            }

            const updated = await submitTimesheetEntries(
                current.engagementId,
                current.assignment.id,
                { entryIds },
            )

            props.onTimesheetChange(updated)
            setSelectedDates([])
            setIsDirty(false)
            setIsConfirmOpen(false)
            toast.success(
                `Submitted ${entryIds.length} ${entryIds.length === 1 ? 'entry' : 'entries'} for approval.`,
            )
        } catch (error) {
            setActionError(extractErrorMessage(error, 'Failed to submit the timesheet.'))
            setIsConfirmOpen(false)
        } finally {
            setIsSubmitting(false)
        }
    }, [buildSavePayload, props, selectedDates])

    const handleOpenConfirm = useCallback(() => {
        if (invalidRows.length) {
            setActionError('Fix the highlighted hours before submitting.')
            return
        }

        const submittable = selectedRows.filter(hasEnteredHours)
        if (submittable.length !== selectedRows.length) {
            setActionError(
                'Some selected rows have no hours entered. Enter hours or clear the selection.',
            )
            return
        }

        setActionError(undefined)
        setIsConfirmOpen(true)
    }, [invalidRows.length, selectedRows])

    return (
        <div className={styles.view}>
            <section className={styles.rangeSection}>
                <InputDatePicker
                    date={toPickerDate(fromDate)}
                    disabled={false}
                    label='From Date'
                    onChange={function onFromChange(date: Date | null) {
                        setFromDate(date ? toWorkDateString(date) : '')
                    }}
                />
                <InputDatePicker
                    date={toPickerDate(toDate)}
                    disabled={false}
                    label='To Date'
                    onChange={function onToChange(date: Date | null) {
                        setToDate(date ? toWorkDateString(date) : '')
                    }}
                />
                <Button
                    disabled={isSaving || !isDirty}
                    label={isSaving ? 'Saving...' : 'Save'}
                    onClick={handleSave}
                    secondary
                />
            </section>

            {rangeError
                ? <p className={styles.error} role='alert'>{rangeError}</p>
                : (
                    <>
                        <TimesheetGrid
                            emptyMessage='Pick a date range to start entering hours.'
                            onRowChange={handleRowChange}
                            onSelectionChange={setSelectedDates}
                            rows={rows}
                            selectedDates={selectedDates}
                            standardHoursPerDay={standardHoursPerDay}
                        />

                        {actionError && (
                            <p className={styles.error} role='alert'>{actionError}</p>
                        )}

                        {selectedRows.length > 0 && (
                            <section className={styles.summary}>
                                <span>
                                    Total Days:
                                    {' '}
                                    <strong>{totals.days}</strong>
                                </span>
                                <span>
                                    Total Hours:
                                    {' '}
                                    <strong>{formatHoursLabel(totals.hours)}</strong>
                                </span>
                                <Button
                                    disabled={isSubmitting}
                                    label={`Submit (${selectedRows.length})`}
                                    onClick={handleOpenConfirm}
                                    primary
                                />
                            </section>
                        )}
                    </>
                )}

            <TimesheetSubmitModal
                entryCount={selectedRows.length}
                isSubmitting={isSubmitting}
                onCancel={function onCancel() {
                    setIsConfirmOpen(false)
                }}
                onConfirm={handleSubmit}
                open={isConfirmOpen}
                totalHours={totals.hours}
            />
        </div>
    )
}

export default MemberTimesheetView
