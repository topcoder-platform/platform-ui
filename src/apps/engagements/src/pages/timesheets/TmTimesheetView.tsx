import { ChangeEvent, FC, useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import { Button, InputDatePicker, InputSelect } from '~/libs/ui'

import { TimesheetApproveModal } from '../../components/timesheet-approve-modal'
import { TimesheetGrid } from '../../components/timesheet-grid'
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

import styles from './TimesheetsPage.module.scss'

interface TmTimesheetViewProps {
    timesheet: TimesheetView
    onTimesheetChange: (timesheet: TimesheetView) => void
}

type StatusFilter = TimesheetEntryStatus.APPROVED | TimesheetEntryStatus.SUBMITTED

const STATUS_FILTER_OPTIONS = [
    {
        label: 'Pending Approval',
        value: TimesheetEntryStatus.SUBMITTED,
    },
    {
        label: 'Approved',
        value: TimesheetEntryStatus.APPROVED,
    },
]

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
 * TM approval view.
 *
 * Talent Managers can approve submitted rows, but may not edit, submit, or reopen entries.
 */
const TmTimesheetView: FC<TmTimesheetViewProps> = (props: TmTimesheetViewProps) => {
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
    const isPendingApprovalView = !isApprovedView

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
        // Reload only on filter changes. Depending on reload itself would also trigger on every
        // refreshed timesheet response.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fromDate, rangeError, statusFilter, toDate])

    const handleApprove = useCallback(async (approvalComment: string) => {
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
                { approvalComment, entryIds },
            )

            setIsConfirmOpen(false)
            setSelectedDates([])

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
                <InputSelect
                    classNameWrapper={styles.dateFilterWrapper}
                    dirty
                    label='Status'
                    name='timesheet-tm-status-filter'
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
                            className={styles.dateFilter}
                            classNameWrapper={styles.dateFilterWrapper}
                            date={toPickerDate(fromDate)}
                            disabled={false}
                            isClearable
                            label='From Date'
                            onChange={function onFromChange(date: Date | null) {
                                setFromDate(date ? toWorkDateString(date) : '')
                            }}
                        />
                        <InputDatePicker
                            className={styles.dateFilter}
                            classNameWrapper={styles.dateFilterWrapper}
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
                <TimesheetGrid
                    emptyMessage={isPendingApprovalView
                        ? 'Nothing is waiting for approval.'
                        : 'No approved entries in this period.'}
                    onSelectionChange={setSelectedDates}
                    readOnly
                    rows={rows}
                    selectedDates={isPendingApprovalView ? selectedDates : []}
                    standardHoursPerDay={props.timesheet.assignment.standardHoursPerDay}
                />
            )}

            {actionError && <p className={styles.error} role='alert'>{actionError}</p>}
            {partialResult && (
                <p className={styles.partialResult} role='status'>{partialResult}</p>
            )}

            {isPendingApprovalView && selectedRows.length > 0 && (
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

            <TimesheetApproveModal
                entryCount={selectedRows.length}
                isApproving={isApproving}
                onCancel={function onCancel() {
                    setIsConfirmOpen(false)
                }}
                onConfirm={handleApprove}
                open={isConfirmOpen}
                totalHours={totals.hours}
            />
        </div>
    )
}

export default TmTimesheetView
