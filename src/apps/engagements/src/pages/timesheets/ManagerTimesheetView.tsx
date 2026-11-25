import { ChangeEvent, FC, useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import { Button, InputDatePicker, InputSelect } from '~/libs/ui'

import type { TimesheetView } from '../../lib/models'
import { TimesheetEntryStatus } from '../../lib/models'
import { approveTimesheetEntries, getTimesheet, returnTimesheetEntries } from '../../lib/services'
import type { TimesheetReviewStatus } from '../../lib/utils'
import {
    buildRowsFromEntries,
    formatHoursLabel,
    sumSelectedTotals,
    toWorkDateString,
    validateDateRange,
} from '../../lib/utils'
import { TimesheetApproveModal } from '../../components/timesheet-approve-modal'
import { TimesheetGrid } from '../../components/timesheet-grid'
import { TimesheetReasonModal } from '../../components/timesheet-reason-modal'

import styles from './TimesheetsPage.module.scss'

interface ManagerTimesheetViewProps {
    timesheet: TimesheetView
    onTimesheetChange: (timesheet: TimesheetView) => void
    /**
     * True when the caller is an administrator approving on a manager's behalf, which the API requires
     * an override reason for.
     */
    requiresOverrideReason?: boolean
    /** Status filter to open on - the one the landing list was showing. Defaults to Pending Approval. */
    initialStatus?: TimesheetReviewStatus
}

/**
 * Entries returned for corrections are drafts with a `returnedAt`, not a status of their own, so this
 * filter value exists only here: it loads the drafts and keeps the returned ones.
 */
const RETURNED_FILTER = 'RETURNED'

type StatusFilter = TimesheetReviewStatus | typeof RETURNED_FILTER

const STATUS_FILTER_OPTIONS = [
    {
        label: 'Pending Approval',
        value: TimesheetEntryStatus.SUBMITTED,
    },
    {
        label: 'Approved',
        value: TimesheetEntryStatus.APPROVED,
    },
    {
        label: 'Returned for Corrections',
        value: RETURNED_FILTER,
    },
]

const RETURN_DESCRIPTION = 'You are about to return the following timesheet entries for correction. '
    + 'Please provide the required corrections and confirm the action.'

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
    const [statusFilter, setStatusFilter] = useState<StatusFilter>(
        props.initialStatus ?? TimesheetEntryStatus.SUBMITTED,
    )
    const [fromDate, setFromDate] = useState<string>('')
    const [toDate, setToDate] = useState<string>('')
    const [selectedDates, setSelectedDates] = useState<string[]>([])
    const [isApproving, setIsApproving] = useState<boolean>(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false)
    const [isReturning, setIsReturning] = useState<boolean>(false)
    const [isReturnOpen, setIsReturnOpen] = useState<boolean>(false)
    const [actionError, setActionError] = useState<string | undefined>()
    const [partialResult, setPartialResult] = useState<string | undefined>()

    const isApprovedView = statusFilter === TimesheetEntryStatus.APPROVED
    const isReturnedView = statusFilter === RETURNED_FILTER
    const isPendingView = statusFilter === TimesheetEntryStatus.SUBMITTED
    const rangeError = isApprovedView ? validateDateRange(fromDate, toDate) : undefined

    const reload = useCallback(async (): Promise<void> => {
        const loaded = await getTimesheet(
            props.timesheet.engagementId,
            props.timesheet.assignment.id,
            {
                fromDate: isApprovedView ? fromDate || undefined : undefined,
                status: isReturnedView ? TimesheetEntryStatus.DRAFT : statusFilter,
                toDate: isApprovedView ? toDate || undefined : undefined,
            },
        )

        props.onTimesheetChange(loaded)
    }, [fromDate, isApprovedView, isReturnedView, props, statusFilter, toDate])

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
            props.timesheet.entries.filter(entry => (isReturnedView
                ? entry.status === TimesheetEntryStatus.DRAFT && Boolean(entry.returnedAt)
                : entry.status === statusFilter)),
        ),
        [isReturnedView, props.timesheet.entries, statusFilter],
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

    const handleReturn = useCallback(async (returnComment: string) => {
        const entryIds = selectedRows
            .map(row => row.id)
            .filter((id): id is string => Boolean(id))

        if (!entryIds.length) {
            setActionError('Select at least one submitted entry to return.')
            return
        }

        setActionError(undefined)
        setPartialResult(undefined)
        setIsReturning(true)

        try {
            await returnTimesheetEntries(
                props.timesheet.engagementId,
                props.timesheet.assignment.id,
                { entryIds, returnComment },
            )

            setIsReturnOpen(false)
            setSelectedDates([])
            toast.success(
                `Returned ${entryIds.length} ${entryIds.length === 1 ? 'entry' : 'entries'} for corrections. `
                + 'The member has been notified.',
            )

            await reload()
        } catch (error) {
            setActionError(extractErrorMessage(error, 'Failed to return the selected entries.'))
            setIsReturnOpen(false)
        } finally {
            setIsReturning(false)
        }
    }, [props, reload, selectedRows])

    const showReviewActions = isPendingView && !rangeError
    const isActing = isApproving || isReturning
    const selectionCount = selectedRows.length ? ` (${selectedRows.length})` : ''

    // Rendered at both the top and the bottom of the pending list so long lists don't force a
    // scroll to reach them; disabled until at least one entry is selected.
    function renderReviewActions(): JSX.Element {
        return (
            <>
                <Button
                    disabled={isActing || selectedRows.length === 0}
                    label={`Return for corrections${selectionCount}`}
                    onClick={function onOpenReturn() {
                        setActionError(undefined)
                        setIsReturnOpen(true)
                    }}
                    secondary
                />
                <Button
                    disabled={isActing || selectedRows.length === 0}
                    label={`Approve${selectionCount}`}
                    onClick={function onOpenConfirm() {
                        setActionError(undefined)
                        setIsConfirmOpen(true)
                    }}
                    primary
                />
            </>
        )
    }

    return (
        <div className={styles.view}>
            <section className={styles.rangeSection}>
                <InputSelect
                    classNameWrapper={`${styles.dateFilterWrapper} ${styles.selectFilter}`}
                    dirty
                    label='Status'
                    name='timesheet-status-filter'
                    onChange={function onStatusChange(event: ChangeEvent<HTMLInputElement>) {
                        setStatusFilter(event.target.value as StatusFilter)
                        setPartialResult(undefined)
                    }}
                    options={STATUS_FILTER_OPTIONS}
                    placeholder='Select status'
                    value={statusFilter}
                />

                {isApprovedView && (
                    <>
                        <InputDatePicker
                            classNameWrapper={styles.dateFilterWrapper}
                            className={styles.dateFilter}
                            date={toPickerDate(fromDate)}
                            disabled={false}
                            isClearable
                            label='From Date'
                            onChange={function onFromChange(date: Date | null) {
                                setFromDate(date ? toWorkDateString(date) : '')
                            }}
                        />
                        <InputDatePicker
                            classNameWrapper={styles.dateFilterWrapper}
                            className={styles.dateFilter}
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

                {showReviewActions && (
                    <div className={styles.topActions}>
                        {renderReviewActions()}
                    </div>
                )}
            </section>

            {rangeError && <p className={styles.error} role='alert'>{rangeError}</p>}

            {!rangeError && (
                <>
                    <TimesheetGrid
                        emptyMessage={(isApprovedView && 'No approved entries in this period.')
                            || (isReturnedView && 'No entries are waiting for corrections.')
                            || 'Nothing is waiting for approval.'}
                        onSelectionChange={setSelectedDates}
                        readOnly
                        rows={rows}
                        selectedDates={isPendingView ? selectedDates : []}
                        standardHoursPerDay={props.timesheet.assignment.standardHoursPerDay}
                    />

                    {actionError && <p className={styles.error} role='alert'>{actionError}</p>}
                    {partialResult && (
                        <p className={styles.partialResult} role='status'>{partialResult}</p>
                    )}

                    {isPendingView && selectedRows.length > 0 && (
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
                        </section>
                    )}

                    {showReviewActions && (
                        <section className={styles.actions}>
                            {renderReviewActions()}
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

            <TimesheetReasonModal
                confirmLabel='Return'
                description={RETURN_DESCRIPTION}
                isSubmitting={isReturning}
                onCancel={function onCancelReturn() {
                    setIsReturnOpen(false)
                }}
                onConfirm={handleReturn}
                open={isReturnOpen}
                reasonLabel='Required corrections'
                title='Return timesheet entries for corrections'
                totals={{ entryCount: selectedRows.length, totalHours: totals.hours }}
            />
        </div>
    )
}

export default ManagerTimesheetView
