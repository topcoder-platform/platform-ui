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
import { useFetchPendingSubmissionTimesheets } from '../../hooks'
import {
    PendingSubmissionReminderResult,
    PendingSubmissionTimesheetRow,
} from '../../models'
import { sendPendingSubmissionReminders } from '../../services'
import { formatApprovedTimesheetWorkPeriod } from '../../utils/approved-timesheet.utils'
import {
    formatApprovers,
    getPreviousWorkWeek,
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

import styles from './PendingTimesheetSubmissionsTab.module.scss'

const FILTER_DEBOUNCE_MS = 300
/** The longest period the member's timesheet page can open, which is where the reminder links. */
const MAX_PERIOD_DAYS = 31
const DAY_IN_MS = 24 * 60 * 60 * 1000

const columnLabels = [
    'Engagement Name',
    'Assignee',
    'Work Period',
    'Approver',
]

function getPeriodError(fromDate?: Date, toDate?: Date): string | undefined {
    if (!fromDate || !toDate) {
        return 'Choose the work period to check, from and to.'
    }

    if (toDate.getTime() < fromDate.getTime()) {
        return 'The to date cannot be earlier than the from date.'
    }

    // Rounded, so a daylight saving change inside the period does not shift the day count.
    if (Math.round((toDate.getTime() - fromDate.getTime()) / DAY_IN_MS) + 1 > MAX_PERIOD_DAYS) {
        return `The work period cannot span more than ${MAX_PERIOD_DAYS} days.`
    }

    return undefined
}

/**
 * Tells the administrator who was reminded, and calls out members who could not be.
 */
function reportReminderResult(result: PendingSubmissionReminderResult): void {
    const unsent = result.recipients.filter(recipient => !recipient.sent)

    if (result.sentCount) {
        showSuccessToast(`Reminder sent to ${pluralize(result.sentCount, 'member', 'members')}`)
    }

    if (unsent.length) {
        showErrorToast(
            `Could not send a reminder to ${unsent.map(recipient => recipient.handle)
                .join(', ')}: no email address on file.`,
        )
    }

    if (result.skippedAssignmentIds.length) {
        showInfoToast(
            `${pluralize(result.skippedAssignmentIds.length, 'selected timesheet', 'selected timesheets')} `
            + 'submitted since the list was loaded, so no reminder was needed.',
        )
    }

    if (!result.recipients.length && !result.skippedAssignmentIds.length) {
        showInfoToast('No reminders were sent.')
    }
}

interface PendingTimesheetSubmissionsTabProps {
    /** Leaves out assignments on the test projects the API is configured with. */
    excludeTestProjects?: boolean
}

/**
 * Active assignments with nothing submitted for a work period - the previous working week unless the
 * administrator picks another - with the ability to remind the members by email. Administrators only.
 */
export const PendingTimesheetSubmissionsTab: FC<PendingTimesheetSubmissionsTabProps> = (
    props: PendingTimesheetSubmissionsTabProps,
) => {
    const excludeTestProjects = props.excludeTestProjects === true
    const defaultPeriod = useMemo(() => getPreviousWorkWeek(), [])
    const [engagementInput, setEngagementInput] = useState<string>('')
    const [engagementFilter, setEngagementFilter] = useState<string>('')
    const [fromDate, setFromDate] = useState<Date | undefined>(defaultPeriod.fromDate)
    const [toDate, setToDate] = useState<Date | undefined>(defaultPeriod.toDate)
    const [page, setPage] = useState<number>(1)
    const [perPage, setPerPage] = useState<number>(PAGE_SIZE)
    // Keyed by row id and kept across pages and the engagement filter, so a selection can span
    // engagements. A new work period starts it over: whether a member is behind depends on it.
    const [selectedRows, setSelectedRows] = useState<Record<string, PendingSubmissionTimesheetRow>>({})
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false)
    const [isSending, setIsSending] = useState<boolean>(false)

    const periodError = getPeriodError(fromDate, toDate)
    const fromDateFilter = fromDate ? toWorkDateString(fromDate) : ''
    const toDateFilter = toDate ? toWorkDateString(toDate) : ''

    useEffect(() => {
        const timeout = setTimeout(() => {
            setEngagementFilter(engagementInput.trim())
        }, FILTER_DEBOUNCE_MS)

        return () => clearTimeout(timeout)
    }, [engagementInput])

    useEffect(() => {
        setPage(1)
    }, [engagementFilter, excludeTestProjects, fromDateFilter, toDateFilter])

    useEffect(() => {
        setSelectedRows({})
    }, [fromDateFilter, toDateFilter])

    // An incomplete or invalid period is shown as an error and never sent.
    const pendingResult = useFetchPendingSubmissionTimesheets(
        {
            engagement: engagementFilter || undefined,
            excludeTestProjects,
            fromDate: fromDateFilter,
            page,
            perPage,
            toDate: toDateFilter,
        },
        !periodError,
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
    const selectedMemberCount = useMemo(
        () => new Set(selected.map(row => row.assigneeId)).size,
        [selected],
    )
    const isAllOnPageSelected = rows.length > 0 && rows.every(row => !!selectedRows[row.id])

    const toggleRow = useCallback((row: PendingSubmissionTimesheetRow): void => {
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
        if (!selected.length || periodError) {
            return
        }

        setIsSending(true)

        try {
            const result = await sendPendingSubmissionReminders(
                selected.map(row => row.assignmentId),
                fromDateFilter,
                toDateFilter,
            )

            reportReminderResult(result)
            setSelectedRows({})
            setIsConfirmOpen(false)
        } catch (error) {
            showErrorToast(error instanceof Error ? error.message : 'Failed to send submission reminders')
        } finally {
            setIsSending(false)
            pendingResult.mutate()
                .catch(() => undefined)
        }
    }, [fromDateFilter, pendingResult, periodError, selected, toDateFilter])

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
                        Every active assignment has submitted a timesheet for this work period.
                    </td>
                </tr>
            )
        }

        return rows.map(row => (
            <tr key={row.id}>
                <td className={styles.checkboxCell}>
                    <input
                        aria-label={`Select ${row.assigneeHandle} on ${row.engagementTitle}`}
                        checked={!!selectedRows[row.id]}
                        onChange={() => toggleRow(row)}
                        type='checkbox'
                    />
                </td>
                <td className={styles.engagementTitle}>{row.engagementTitle || '-'}</td>
                <td className={styles.memberHandle}>{row.assigneeHandle || '-'}</td>
                <td className={styles.noWrap}>{formatApprovedTimesheetWorkPeriod(row)}</td>
                <td className={row.approvers.length ? undefined : styles.noApprover}>
                    {formatApprovers(row.approvers)}
                </td>
            </tr>
        ))
    }

    function renderTable(): JSX.Element {
        if (periodError) {
            return <ErrorMessage message={periodError} />
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
                                    aria-label='Select all pending submissions on this page'
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

    const periodLabel = fromDateFilter && toDateFilter
        ? formatApprovedTimesheetWorkPeriod({ workPeriodEnd: toDateFilter, workPeriodStart: fromDateFilter })
        : ''

    return (
        <div className={styles.container}>
            <div className={styles.filters}>
                <div className={styles.filterField}>
                    <label htmlFor='work-pending-submissions-engagement-search'>Search by engagement name</label>
                    <div className={styles.searchInputWrap}>
                        <IconOutline.SearchIcon className={styles.searchIcon} />
                        <input
                            id='work-pending-submissions-engagement-search'
                            aria-label='Search pending submissions by engagement name'
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
                    disabled={!selected.length || isSending || !!periodError}
                    onClick={() => setIsConfirmOpen(true)}
                />
            </div>

            {renderTable()}

            {totalCount > 0 && !pendingResult.error && !periodError && (
                <Pagination
                    page={page}
                    perPage={perPage}
                    total={totalCount}
                    itemLabel='assignments'
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
                            `Send a reminder to submit timesheets for ${periodLabel} to `
                            + `${pluralize(selectedMemberCount, 'member', 'members')}? `
                            + `Each selected assignment gets its own email (${pluralize(
                                selected.length,
                                'assignment',
                                'assignments',
                            )}).`
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
                        title='Send Submission Reminders'
                    />
                )
                : undefined}
        </div>
    )
}

export default PendingTimesheetSubmissionsTab
