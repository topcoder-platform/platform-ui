import { FC, FocusEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import { Button, InputDatePicker } from '~/libs/ui'

import type { TimesheetView } from '../../lib/models'
import { TimesheetEntryStatus } from '../../lib/models'
import { approveTimesheetEntries, getTimesheet } from '../../lib/services'
import {
    buildRowsFromEntries,
    formatHoursLabel,
    sumSelectedTotals,
    toWorkDateString,
    validateDateRange,
} from '../../lib/utils'
import { TimesheetApproveModal } from '../../components/timesheet-approve-modal'
import { TimesheetGrid } from '../../components/timesheet-grid'

import styles from './TimesheetsPage.module.scss'

interface ManagerTimesheetViewProps {
    timesheet: TimesheetView
    onTimesheetChange: (timesheet: TimesheetView) => void
    /**
     * True when the caller is an administrator approving on a manager's behalf, which the API requires
     * an override reason for.
     */
    requiresOverrideReason?: boolean
}

type StatusFilter = TimesheetEntryStatus.APPROVED | TimesheetEntryStatus.SUBMITTED

const extractErrorMessage = (error: unknown, fallback: string): string => {
    const typedError = error as {
        message?: string
        response?: { data?: { message?: string } }
    }

    return typedError?.response?.data?.message || typedError?.message || fallback
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
 * The manager's review view.
 *
 * A Status dropdown replaces the member's date pickers: a manager comes here to clear what is pending,
 * not to browse a range. Picking `Approved` brings the range pickers back, because approved work is
 * looked up by period.
 */
const ManagerTimesheetView: FC<ManagerTimesheetViewProps> = (props: ManagerTimesheetViewProps) => {
    const [statusFilter, setStatusFilter] = useState<StatusFilter>(TimesheetEntryStatus.SUBMITTED)
    const [fromDate, setFromDate] = useState<string>('')
    const [toDate, setToDate] = useState<string>('')
    const [selectedDates, setSelectedDates] = useState<string[]>([])
    const [isApproving, setIsApproving] = useState<boolean>(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false)
    const [actionError, setActionError] = useState<string | undefined>()
    const [partialResult, setPartialResult] = useState<string | undefined>()

    const isApprovedView = statusFilter === TimesheetEntryStatus.APPROVED
    const rangeError = isApprovedView ? validateDateRange(fromDate, toDate) : undefined

    const reload = useCallback(async (): Promise<void> => {
        const loaded = await getTimesheet(
            props.timesheet.engagementId,
            props.timesheet.assignment.id,
            {
                fromDate: isApprovedView ? fromDate || undefined : undefined,
                status: statusFilter,
                toDate: isApprovedView ? toDate || undefined : undefined,
            },
        )

        props.onTimesheetChange(loaded)
    }, [fromDate, isApprovedView, props, statusFilter, toDate])

    useEffect(() => {
        if (rangeError) {
            return
        }

        setSelectedDates([])
        reload()
            .catch(error => {
                setActionError(extractErrorMessage(error, 'Failed to load the timesheet.'))
            })
        // Reload only when the filter itself changes; `reload` closes over the current timesheet, and
        // depending on it here would refetch after every response.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fromDate, rangeError, statusFilter, toDate])

    const rows = useMemo(
        () => buildRowsFromEntries(
            props.timesheet.entries.filter(entry => entry.status === statusFilter),
        ),
        [props.timesheet.entries, statusFilter],
    )
    const selectedRows = useMemo(
        () => rows.filter(row => selectedDates.includes(row.workDate)),
        [rows, selectedDates],
    )
    const totals = useMemo(() => sumSelectedTotals(selectedRows), [selectedRows])

    const handleApprove = useCallback(async (
        approvalComment: string,
        overrideReason?: string,
    ) => {
        const entryIds = selectedRows
            .map(row => row.id)
            .filter((id): id is string => Boolean(id))

        if (!entryIds.length) {
            setActionError('Select at least one submitted entry to approve.')
            return
        }

        setActionError(undefined)
        setPartialResult(undefined)
        setIsApproving(true)

        try {
            const result = await approveTimesheetEntries(
                props.timesheet.engagementId,
                props.timesheet.assignment.id,
                { approvalComment, entryIds, overrideReason },
            )

            setIsConfirmOpen(false)
            setSelectedDates([])

            // Partial results are normal, not an error: another manager may have taken some of this
            // selection first. Say so plainly rather than reporting a clean success.
            if (result.skipped.length) {
                const takenBy = Array.from(new Set(
                    result.skipped
                        .map(entry => entry.approvedByHandle)
                        .filter((handle): handle is string => Boolean(handle)),
                ))

                setPartialResult(
                    `${result.approved.length} of ${entryIds.length} approved. `
                    + `${result.skipped.length} `
                    + `${result.skipped.length === 1 ? 'entry was' : 'entries were'} already `
                    + `handled${takenBy.length ? ` by ${takenBy.join(', ')}` : ''}.`,
                )
            } else {
                toast.success(
                    `Approved ${result.approved.length} `
                    + `${result.approved.length === 1 ? 'entry' : 'entries'}.`,
                )
            }

            await reload()
        } catch (error) {
            setActionError(extractErrorMessage(error, 'Failed to approve the selected entries.'))
            setIsConfirmOpen(false)
        } finally {
            setIsApproving(false)
        }
    }, [props, reload, selectedRows])

    return (
        <div className={styles.view}>
            <section className={styles.rangeSection}>
                <label className={styles.statusField} htmlFor='timesheet-status-filter'>
                    Status
                    <select
                        id='timesheet-status-filter'
                        onChange={function onStatusChange(event: FocusEvent<HTMLSelectElement>) {
                            setStatusFilter(event.target.value as StatusFilter)
                            setPartialResult(undefined)
                        }}
                        value={statusFilter}
                    >
                        <option value={TimesheetEntryStatus.SUBMITTED}>Pending Approval</option>
                        <option value={TimesheetEntryStatus.APPROVED}>Approved</option>
                    </select>
                </label>

                {isApprovedView && (
                    <>
                        <InputDatePicker
                            date={toPickerDate(fromDate)}
                            disabled={false}
                            isClearable
                            label='From Date'
                            onChange={function onFromChange(date: Date | null) {
                                setFromDate(date ? toWorkDateString(date) : '')
                            }}
                        />
                        <InputDatePicker
                            date={toPickerDate(toDate)}
                            disabled={false}
                            isClearable
                            label='To Date'
                            onChange={function onToChange(date: Date | null) {
                                setToDate(date ? toWorkDateString(date) : '')
                            }}
                        />
                    </>
                )}
            </section>

            {rangeError && <p className={styles.error} role='alert'>{rangeError}</p>}

            {!rangeError && (
                <>
                    <TimesheetGrid
                        emptyMessage={isApprovedView
                            ? 'No approved entries in this period.'
                            : 'Nothing is waiting for approval.'}
                        onSelectionChange={setSelectedDates}
                        readOnly
                        rows={rows}
                        selectedDates={isApprovedView ? [] : selectedDates}
                        standardHoursPerDay={props.timesheet.assignment.standardHoursPerDay}
                    />

                    {actionError && <p className={styles.error} role='alert'>{actionError}</p>}
                    {partialResult && (
                        <p className={styles.partialResult} role='status'>{partialResult}</p>
                    )}

                    {!isApprovedView && selectedRows.length > 0 && (
                        <section className={styles.summary}>
                            <span>
                                Total Selected Days:
                                {' '}
                                <strong>{totals.days}</strong>
                            </span>
                            <span>
                                Total Selected Hours:
                                {' '}
                                <strong>{formatHoursLabel(totals.hours)}</strong>
                            </span>
                            <Button
                                disabled={isApproving}
                                label={`Approve (${selectedRows.length})`}
                                onClick={function onOpenConfirm() {
                                    setActionError(undefined)
                                    setIsConfirmOpen(true)
                                }}
                                primary
                            />
                        </section>
                    )}
                </>
            )}

            <TimesheetApproveModal
                entryCount={selectedRows.length}
                isApproving={isApproving}
                onCancel={function onCancel() {
                    setIsConfirmOpen(false)
                }}
                onConfirm={handleApprove}
                open={isConfirmOpen}
                requiresOverrideReason={props.requiresOverrideReason}
                totalHours={totals.hours}
            />
        </div>
    )
}

export default ManagerTimesheetView
