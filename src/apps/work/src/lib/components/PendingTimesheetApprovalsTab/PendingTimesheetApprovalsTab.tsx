/* eslint-disable react/jsx-no-bind */

import {
    ChangeEvent,
    FC,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'

import {
    Button,
    IconOutline,
    InputDatePicker,
} from '~/libs/ui'

import { PAGE_SIZE } from '../../constants'
import { useFetchPendingApprovalTimesheets } from '../../hooks'
import {
    PendingApprovalReminderResult,
    PendingApprovalTimesheetRow,
} from '../../models'
import { sendPendingApprovalReminders } from '../../services'
import { formatApprovedTimesheetWorkPeriod } from '../../utils/approved-timesheet.utils'
import { formatDate } from '../../utils/date.utils'
import {
    formatApprovers,
    pluralize,
    toWorkDateString,
} from '../../utils/timesheet-reminder.utils'
import {
    showErrorToast,
    showInfoToast,
    showSuccessToast,
} from '../../utils/toast.utils'
import { ConfirmationModal } from '../ConfirmationModal'
import { ErrorMessage } from '../ErrorMessage'
import { LoadingSpinner } from '../LoadingSpinner'
import { Pagination } from '../Pagination'

import styles from './PendingTimesheetApprovalsTab.module.scss'

const FILTER_DEBOUNCE_MS = 300

const columnLabels = [
    'Engagement Name',
    'Assignee',
    'Work Period',
    'Submitted Date',
    'Approver',
]

/**
 * Tells the administrator who was reminded, and calls out anyone who could not be: managers without
 * an email address, and engagements nobody manages.
 */
function reportReminderResult(result: PendingApprovalReminderResult): void {
    const unsent = result.recipients.filter(recipient => !recipient.sent)

    if (result.sentCount) {
        showSuccessToast(`Reminder sent to ${pluralize(result.sentCount, 'manager', 'managers')}`)
    }

    if (unsent.length) {
        showErrorToast(
            `Could not send a reminder to ${unsent.map(recipient => recipient.handle)
                .join(', ')}.`,
        )
    }

    if (result.engagementsWithoutManagers.length) {
        showErrorToast(
            `No manager is assigned to ${result.engagementsWithoutManagers
                .map(engagement => engagement.engagementTitle)
                .join(', ')}, so nobody was reminded about it.`,
        )
    }

    if (result.skippedAssignmentIds.length) {
        showInfoToast(
            `${pluralize(result.skippedAssignmentIds.length, 'selected timesheet', 'selected timesheets')} `
            + 'no longer awaiting approval, so no reminder was needed.',
        )
    }

    if (
        !result.sentCount
        && !unsent.length
        && !result.engagementsWithoutManagers.length
        && !result.skippedAssignmentIds.length
    ) {
        showInfoToast('No reminders were sent.')
    }
}

interface PendingTimesheetApprovalsTabProps {
    /** Leaves out timesheets on the test projects the API is configured with. */
    excludeTestProjects?: boolean
}

/**
 * Submitted timesheets still waiting for approval across every engagement, one row per submission,
 * with the ability to remind the engagements' managers by email. Administrators only.
 */
export const PendingTimesheetApprovalsTab: FC<PendingTimesheetApprovalsTabProps> = (
    props: PendingTimesheetApprovalsTabProps,
) => {
    const excludeTestProjects = props.excludeTestProjects === true
    const [engagementInput, setEngagementInput] = useState<string>('')
    const [engagementFilter, setEngagementFilter] = useState<string>('')
    const [fromDate, setFromDate] = useState<Date | undefined>()
    const [toDate, setToDate] = useState<Date | undefined>()
    const [page, setPage] = useState<number>(1)
    const [perPage, setPerPage] = useState<number>(PAGE_SIZE)
    // Keyed by row id and kept across pages and filters, so a selection can span engagements.
    const [selectedRows, setSelectedRows] = useState<Record<string, PendingApprovalTimesheetRow>>({})
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false)
    const [isSending, setIsSending] = useState<boolean>(false)

    const fromDateFilter = fromDate ? toWorkDateString(fromDate) : undefined
    const toDateFilter = toDate ? toWorkDateString(toDate) : undefined
    const isRangeInverted = !!fromDateFilter && !!toDateFilter && toDateFilter < fromDateFilter

    useEffect(() => {
        const timeout = setTimeout(() => {
            setEngagementFilter(engagementInput.trim())
        }, FILTER_DEBOUNCE_MS)

        return () => clearTimeout(timeout)
    }, [engagementInput])

    useEffect(() => {
        setPage(1)
    }, [engagementFilter, excludeTestProjects, fromDateFilter, toDateFilter])

    // An inverted range is shown as an error and never sent.
    const pendingResult = useFetchPendingApprovalTimesheets(
        {
            engagement: engagementFilter || undefined,
            excludeTestProjects,
            fromDate: fromDateFilter,
            page,
            perPage,
            toDate: toDateFilter,
        },
        !isRangeInverted,
    )
    const rows = pendingResult.rows
    const totalCount = pendingResult.meta?.totalCount ?? 0

    useEffect(() => {
        const totalPages = Math.max(1, pendingResult.meta?.totalPages ?? 1)

        if (page > totalPages) {
            setPage(totalPages)
        }
    }, [pendingResult.meta?.totalPages, page])

    const selected = useMemo(() => Object.values(selectedRows), [selectedRows])
    const selectedAssignmentIds = useMemo(
        () => Array.from(new Set(selected.map(row => row.assignmentId))),
        [selected],
    )
    const selectedManagerCount = useMemo(
        () => new Set(selected.flatMap(row => row.approvers.map(approver => approver.userId))).size,
        [selected],
    )
    const isAllOnPageSelected = rows.length > 0 && rows.every(row => !!selectedRows[row.id])

    const toggleRow = useCallback((row: PendingApprovalTimesheetRow): void => {
        setSelectedRows(previous => {
            const next = { ...previous }

            if (next[row.id]) {
                delete next[row.id]
            } else {
                next[row.id] = row
            }

            return next
        })
    }, [])

    const togglePage = useCallback((): void => {
        setSelectedRows(previous => {
            const next = { ...previous }

            rows.forEach(row => {
                if (isAllOnPageSelected) {
                    delete next[row.id]
                } else {
                    next[row.id] = row
                }
            })

            return next
        })
    }, [isAllOnPageSelected, rows])

    const clearSelection = useCallback((): void => {
        setSelectedRows({})
    }, [])

    const handleSendConfirm = useCallback(async (): Promise<void> => {
        if (!selectedAssignmentIds.length) {
            return
        }

        setIsSending(true)

        try {
            const result = await sendPendingApprovalReminders(selectedAssignmentIds)

            reportReminderResult(result)
            setSelectedRows({})
            setIsConfirmOpen(false)
        } catch (error) {
            showErrorToast(error instanceof Error ? error.message : 'Failed to send approval reminders')
        } finally {
            setIsSending(false)
            pendingResult.mutate()
                .catch(() => undefined)
        }
    }, [pendingResult, selectedAssignmentIds])

    function handleEngagementChange(event: ChangeEvent<HTMLInputElement>): void {
        setEngagementInput(event.target.value)
    }

    function handleFromDateChange(date: Date | null): void {
        setFromDate(date ?? undefined)
    }

    function handleToDateChange(date: Date | null): void {
        setToDate(date ?? undefined)
    }

    function renderBody(): JSX.Element | JSX.Element[] {
        if (!rows.length) {
            return (
                <tr>
                    <td colSpan={columnLabels.length + 1} className={styles.emptyRow}>
                        No timesheets are pending approval.
                    </td>
                </tr>
            )
        }

        return rows.map(row => (
            <tr key={row.id}>
                <td className={styles.checkboxCell}>
                    <input
                        aria-label={`Select ${row.assigneeHandle} ${formatApprovedTimesheetWorkPeriod(row)}`}
                        checked={!!selectedRows[row.id]}
                        onChange={() => toggleRow(row)}
                        type='checkbox'
                    />
                </td>
                <td className={styles.engagementTitle}>{row.engagementTitle || '-'}</td>
                <td className={styles.memberHandle}>{row.assigneeHandle || '-'}</td>
                <td className={styles.noWrap}>{formatApprovedTimesheetWorkPeriod(row)}</td>
                <td className={styles.noWrap}>{formatDate(row.submittedAt)}</td>
                <td className={row.approvers.length ? undefined : styles.noApprover}>
                    {formatApprovers(row.approvers)}
                </td>
            </tr>
        ))
    }

    function renderTable(): JSX.Element {
        if (isRangeInverted) {
            return <ErrorMessage message='The to date cannot be earlier than the from date.' />
        }

        if (pendingResult.error) {
            return (
                <ErrorMessage
                    message={pendingResult.error.message}
                    onRetry={() => {
                        pendingResult.mutate()
                            .catch(() => undefined)
                    }}
                />
            )
        }

        if (pendingResult.isLoading) {
            return <LoadingSpinner />
        }

        return (
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.checkboxCell}>
                                <input
                                    aria-label='Select all pending timesheets on this page'
                                    checked={isAllOnPageSelected}
                                    disabled={!rows.length}
                                    onChange={togglePage}
                                    type='checkbox'
                                />
                            </th>
                            {columnLabels.map(label => <th key={label}>{label}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {renderBody()}
                    </tbody>
                </table>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <div className={styles.filters}>
                <div className={styles.filterField}>
                    <label htmlFor='work-pending-timesheets-engagement-search'>Search by engagement name</label>
                    <div className={styles.searchInputWrap}>
                        <IconOutline.SearchIcon className={styles.searchIcon} />
                        <input
                            id='work-pending-timesheets-engagement-search'
                            aria-label='Search pending timesheets by engagement name'
                            className={styles.searchInput}
                            onChange={handleEngagementChange}
                            placeholder='Search by engagement name'
                            type='text'
                            value={engagementInput}
                        />
                    </div>
                </div>

                <div className={styles.filterField}>
                    <InputDatePicker
                        classNameWrapper={styles.datePicker}
                        date={fromDate}
                        disabled={false}
                        isClearable
                        label='Work period from'
                        maxDate={toDate}
                        onChange={handleFromDateChange}
                    />
                </div>

                <div className={styles.filterField}>
                    <InputDatePicker
                        classNameWrapper={styles.datePicker}
                        date={toDate}
                        disabled={false}
                        isClearable
                        label='Work period to'
                        minDate={fromDate}
                        onChange={handleToDateChange}
                    />
                </div>
            </div>

            <div className={styles.toolbar}>
                <span className={styles.selectionInfo}>
                    {`${selected.length} selected`}
                    {selected.length
                        ? (
                            <button
                                className={styles.clearSelection}
                                onClick={clearSelection}
                                type='button'
                            >
                                Clear selection
                            </button>
                        )
                        : undefined}
                </span>
                <Button
                    label='Send Reminder'
                    primary
                    size='md'
                    disabled={!selected.length || isSending}
                    onClick={() => setIsConfirmOpen(true)}
                />
            </div>

            {renderTable()}

            {totalCount > 0 && !pendingResult.error && !isRangeInverted && (
                <Pagination
                    page={page}
                    perPage={perPage}
                    total={totalCount}
                    itemLabel='timesheets'
                    onPageChange={setPage}
                    onPerPageChange={nextPerPage => {
                        setPerPage(nextPerPage)
                        setPage(1)
                    }}
                />
            )}

            {isConfirmOpen
                ? (
                    <ConfirmationModal
                        confirmDisabled={isSending}
                        confirmText={isSending ? 'Sending...' : 'Send Reminder'}
                        message={
                            `Send an approval reminder email for ${pluralize(
                                selected.length,
                                'selected timesheet',
                                'selected timesheets',
                            )}? Each assigned manager gets one email `
                            + `(${pluralize(selectedManagerCount, 'manager', 'managers')}).`
                        }
                        onCancel={() => {
                            if (!isSending) {
                                setIsConfirmOpen(false)
                            }
                        }}
                        onConfirm={() => {
                            handleSendConfirm()
                                .catch(() => undefined)
                        }}
                        title='Send Approval Reminders'
                    />
                )
                : undefined}
        </div>
    )
}

export default PendingTimesheetApprovalsTab
