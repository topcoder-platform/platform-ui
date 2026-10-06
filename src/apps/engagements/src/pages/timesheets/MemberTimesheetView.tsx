import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import { Button, InputDatePicker } from '~/libs/ui'

import type { TimesheetView } from '../../lib/models'
import { TimesheetEntryStatus } from '../../lib/models'
import {
    saveTimesheetEntries,
    submitTimesheetEntries,
} from '../../lib/services'
import type { TimesheetFieldErrors, TimesheetRow } from '../../lib/utils'
import {
    buildTimesheetRows,
    clearTimesheetFieldErrors,
    formatHoursLabel,
    hasEnteredHours,
    hasRowValidationError,
    isRowReadOnly,
    parseTimesheetSaveError,
    sumSelectedTotals,
    toWorkDateString,
    validateEntryRange,
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

const normalizeRemarks = (remarks: string | null | undefined): string => (
    remarks?.trim() || ''
)

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

/**
 * Only an active assignee may enter or submit hours. Once the assignment is completed or terminated the
 * member can still review what they logged; the API refuses the write either way, so this only keeps
 * the page from offering controls that would fail.
 */
const ACTIVE_ASSIGNMENT_STATUS = 'ASSIGNED'

const isRowNeverSelectable = (): boolean => false

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
    const [fieldErrors, setFieldErrors] = useState<TimesheetFieldErrors>({})

    const rangeError = validateEntryRange(fromDate, toDate)
    const standardHoursPerDay = props.timesheet.assignment.standardHoursPerDay
    const isAssignmentActive = props.timesheet.assignment.status === ACTIVE_ASSIGNMENT_STATUS

    // Regenerate the grid whenever the range or the saved entries change, merging saved values in so
    // the member sees their own hours rather than a blank duplicate.
    useEffect(() => {
        if (rangeError) {
            return
        }

        setRows(buildTimesheetRows(fromDate, toDate, props.timesheet.entries))
        setSelectedDates([])
        setIsDirty(false)
        // A new range or a fresh copy of the entries makes any earlier error stale.
        setActionError(undefined)
        setFieldErrors({})
    }, [fromDate, props.timesheet.entries, rangeError, toDate])

    useEffect(() => {
        props.onDirtyChange(isDirty)
    }, [isDirty, props])

    const selectedRows = useMemo(
        () => rows.filter(row => selectedDates.includes(row.workDate)),
        [rows, selectedDates],
    )
    const savedByDate = useMemo(
        () => new Map(props.timesheet.entries.map(entry => [entry.workDate, entry])),
        [props.timesheet.entries],
    )
    const hasOnlyUnchangedSubmittedSelected = useMemo(
        () => selectedRows.length > 0 && selectedRows.every(row => {
            if (row.status !== TimesheetEntryStatus.SUBMITTED) {
                return false
            }

            const saved = savedByDate.get(row.workDate)
            if (!saved) {
                return false
            }

            return row.hoursWorked.trim() === saved.hoursWorked
                && normalizeRemarks(row.remarks) === normalizeRemarks(saved.remarks)
        }),
        [savedByDate, selectedRows],
    )
    const totals = useMemo(() => sumSelectedTotals(selectedRows), [selectedRows])

    const handleRowChange = useCallback((workDate: string, changes: Partial<TimesheetRow>) => {
        setRows(current => current.map(row => (
            row.workDate === workDate ? { ...row, ...changes } : row
        )))
        setIsDirty(true)
        setActionError(undefined)
        setFieldErrors(current => clearTimesheetFieldErrors(current, workDate, Object.keys(changes)))
    }, [])

    const handleSelectionChange = useCallback((workDates: string[]) => {
        setSelectedDates(workDates)
        setActionError(undefined)
    }, [])

    /** Changing the range rebuilds the grid, which clears errors along with it. */
    const handleFromDateChange = useCallback((date: Date | null) => {
        setFromDate(date ? toWorkDateString(date) : '')
        setActionError(undefined)
    }, [])

    const handleToDateChange = useCallback((date: Date | null) => {
        setToDate(date ? toWorkDateString(date) : '')
        setActionError(undefined)
    }, [])

    /** Places the API's per-entry validation messages on their rows; the rest goes to the banner. */
    const showSaveError = useCallback((
        error: unknown,
        entries: Array<{ workDate: string }>,
        fallback: string,
    ) => {
        const parsed = parseTimesheetSaveError(error, entries, fallback)

        setFieldErrors(parsed.fieldErrors)
        setActionError(parsed.message)
    }, [])

    /** Saves every row the member has filled in, not only the selected ones. */
    const buildSavePayload = useCallback(() => (
        rows
            .filter(row => !isRowReadOnly(row))
            .filter(row => hasEnteredHours(row) || Boolean(row.id))
            .filter(row => !hasRowValidationError(row, standardHoursPerDay))
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
            && hasRowValidationError(row, standardHoursPerDay)
        )),
        [rows, standardHoursPerDay],
    )

    const handleSave = useCallback(async () => {
        if (invalidRows.length) {
            setActionError('Fix the highlighted fields before saving.')
            return
        }

        const entries = buildSavePayload()
        if (!entries.length) {
            setActionError('Enter hours on at least one day before saving.')
            return
        }

        setActionError(undefined)
        setFieldErrors({})
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
            showSaveError(error, entries, 'Failed to save the timesheet.')
        } finally {
            setIsSaving(false)
        }
    }, [buildSavePayload, invalidRows.length, props, showSaveError])

    const handleSubmit = useCallback(async () => {
        setActionError(undefined)
        setFieldErrors({})
        setIsSubmitting(true)

        // Save first: a selected row may hold edits, or may never have been saved at all, and the
        // submit endpoint works on entry ids.
        const entries = buildSavePayload()

        try {
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
            showSaveError(error, entries, 'Failed to submit the timesheet.')
            setIsConfirmOpen(false)
        } finally {
            setIsSubmitting(false)
        }
    }, [buildSavePayload, props, selectedDates, showSaveError])

    const handleOpenConfirm = useCallback(() => {
        if (invalidRows.length) {
            setActionError('Fix the highlighted fields before submitting.')
            return
        }

        if (hasOnlyUnchangedSubmittedSelected) {
            setActionError('The selected rows have nothing to submit.')
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
    }, [hasOnlyUnchangedSubmittedSelected, invalidRows.length, selectedRows])

    return (
        <div className={styles.view}>
            <section className={styles.rangeSection}>
                <InputDatePicker
                    className={styles.dateFilter}
                    classNameWrapper={styles.dateFilterWrapper}
                    date={toPickerDate(fromDate)}
                    disabled={false}
                    label='From Date'
                    onChange={handleFromDateChange}
                />
                <InputDatePicker
                    className={styles.dateFilter}
                    classNameWrapper={styles.dateFilterWrapper}
                    date={toPickerDate(toDate)}
                    disabled={false}
                    label='To Date'
                    onChange={handleToDateChange}
                />
                {isAssignmentActive && (
                    <Button
                        disabled={isSaving || !isDirty}
                        label={isSaving ? 'Saving...' : 'Save'}
                        onClick={handleSave}
                        secondary
                    />
                )}
            </section>

            {!isAssignmentActive && (
                <p className={styles.pending} role='status'>
                    This assignment is no longer active, so its timesheet is read-only.
                </p>
            )}

            {rangeError
                ? <p className={styles.error} role='alert'>{rangeError}</p>
                : (
                    <>
                        <TimesheetGrid
                            emptyMessage='Pick a date range to start entering hours.'
                            fieldErrors={fieldErrors}
                            isRowSelectable={isAssignmentActive ? undefined : isRowNeverSelectable}
                            onRowChange={isAssignmentActive ? handleRowChange : undefined}
                            onSelectionChange={handleSelectionChange}
                            readOnly={!isAssignmentActive}
                            rows={rows}
                            selectedDates={selectedDates}
                            standardHoursPerDay={standardHoursPerDay}
                        />

                        {actionError && (
                            <p className={styles.error} role='alert'>{actionError}</p>
                        )}

                        {isAssignmentActive && selectedRows.length > 0 && (
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
                                {!hasOnlyUnchangedSubmittedSelected && (
                                    <Button
                                        disabled={isSubmitting}
                                        label={`Submit (${selectedRows.length})`}
                                        onClick={handleOpenConfirm}
                                        primary
                                    />
                                )}
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
