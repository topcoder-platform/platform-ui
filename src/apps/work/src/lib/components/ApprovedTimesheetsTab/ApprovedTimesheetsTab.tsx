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
} from '~/libs/ui'

import { PAGE_SIZE } from '../../constants'
import { useFetchApprovedTimesheets } from '../../hooks'
import { ApprovedTimesheetRow } from '../../models'
import {
    ApprovedTimesheetPaymentResult,
    createApprovedTimesheetPayments,
} from '../../services/approved-timesheet-payments.service'
import { formatApprovedTimesheetWorkPeriod } from '../../utils/approved-timesheet.utils'
import {
    showErrorToast,
    showSuccessToast,
} from '../../utils/toast.utils'
import { ErrorMessage } from '../ErrorMessage'
import { LoadingSpinner } from '../LoadingSpinner'
import { Pagination } from '../Pagination'

import { PayApprovedTimesheetsModal } from './PayApprovedTimesheetsModal'
import styles from './ApprovedTimesheetsTab.module.scss'

const FILTER_DEBOUNCE_MS = 300

const columnLabels = [
    'Engagement Name',
    'Assignee',
    'Hours Left',
    'Work Period',
    'Approved By',
    'Approval Notes',
]

/** "Mary Jones (maryj)" when the approver's name is known, otherwise the handle alone. */
function formatApprover(row: ApprovedTimesheetRow): string {
    const name = String(row.approvedByName || '')
        .trim()
    const handle = String(row.approvedByHandle || '')
        .trim()

    if (name && handle) {
        return `${name} (${handle})`
    }

    return name || handle || '-'
}

function formatHoursLeft(hoursLeft: number | null): string {
    return hoursLeft === null || hoursLeft === undefined
        ? '-'
        : String(hoursLeft)
}

function describeRow(result: ApprovedTimesheetPaymentResult): string {
    return `${result.row.assigneeHandle} (${formatApprovedTimesheetWorkPeriod(result.row)})`
}

/**
 * Tells the operator what happened to every selected row. A row whose payment exists but whose
 * entries were not marked paid is called out separately: it must be reconciled before it is paid
 * again, since it stays on the list.
 */
function reportPaymentResults(results: ApprovedTimesheetPaymentResult[]): void {
    const paid = results.filter(result => result.status === 'paid')
    const unlinked = results.filter(result => result.status === 'unlinked')
    const failed = results.filter(result => result.status === 'failed')

    if (paid.length) {
        showSuccessToast(
            paid.length === 1
                ? 'Payment created successfully'
                : `${paid.length} payments created successfully`,
        )
    }

    unlinked.forEach(result => {
        const payment = result.paymentReference ? `Payment ${result.paymentReference}` : 'A payment'
        const entryIds = result.row.entryIds.join(', ')
        const message = `${payment} was created for ${describeRow(result)}, but its approved timesheet `
            + `entries (${entryIds}) could not be marked as paid. Reconcile them before paying this period `
            + `again. ${result.message || ''}`

        showErrorToast(message.trim())
    })

    failed.forEach(result => {
        showErrorToast(
            `Failed to create payment for ${describeRow(result)}: ${result.message || 'Unknown error'}`,
        )
    })
}

interface ApprovedTimesheetsTabProps {
    /** Leaves out timesheets on the test projects the API is configured with. */
    excludeTestProjects?: boolean
}

/**
 * Approved, unpaid timesheets across the engagements the caller can see, one row per approval, with
 * the ability to pay a selection of them in one go. Filtering, pagination, and access scoping run on
 * the API.
 */
export const ApprovedTimesheetsTab: FC<ApprovedTimesheetsTabProps> = (
    props: ApprovedTimesheetsTabProps,
) => {
    const excludeTestProjects = props.excludeTestProjects === true
    const [engagementInput, setEngagementInput] = useState<string>('')
    const [assigneeInput, setAssigneeInput] = useState<string>('')
    const [engagementFilter, setEngagementFilter] = useState<string>('')
    const [assigneeFilter, setAssigneeFilter] = useState<string>('')
    const [page, setPage] = useState<number>(1)
    const [perPage, setPerPage] = useState<number>(PAGE_SIZE)
    // Keyed by row id and kept across pages and filters, so a selection can span engagements.
    const [selectedRows, setSelectedRows] = useState<Record<string, ApprovedTimesheetRow>>({})
    const [isPayModalOpen, setIsPayModalOpen] = useState<boolean>(false)
    const [isPaying, setIsPaying] = useState<boolean>(false)

    useEffect(() => {
        const timeout = setTimeout(() => {
            setEngagementFilter(engagementInput.trim())
            setAssigneeFilter(assigneeInput.trim())
        }, FILTER_DEBOUNCE_MS)

        return () => clearTimeout(timeout)
    }, [assigneeInput, engagementInput])

    useEffect(() => {
        setPage(1)
    }, [assigneeFilter, engagementFilter, excludeTestProjects])

    const approvedTimesheetsResult = useFetchApprovedTimesheets({
        assignee: assigneeFilter || undefined,
        engagement: engagementFilter || undefined,
        excludeTestProjects,
        page,
        perPage,
    })
    const rows = approvedTimesheetsResult.rows
    const totalCount = approvedTimesheetsResult.meta?.totalCount ?? 0

    useEffect(() => {
        const totalPages = Math.max(1, approvedTimesheetsResult.meta?.totalPages ?? 1)

        if (page > totalPages) {
            setPage(totalPages)
        }
    }, [approvedTimesheetsResult.meta?.totalPages, page])

    const selected = useMemo(() => Object.values(selectedRows), [selectedRows])
    const isAllOnPageSelected = rows.length > 0 && rows.every(row => !!selectedRows[row.id])

    const toggleRow = useCallback((row: ApprovedTimesheetRow): void => {
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

    const handlePayConfirm = useCallback(async (remarks: string): Promise<void> => {
        if (!selected.length) {
            return
        }

        setIsPaying(true)

        try {
            const results = await createApprovedTimesheetPayments(selected, remarks)

            reportPaymentResults(results)

            // Anything that reached finance is deselected so it cannot be paid twice by accident;
            // rows that failed outright stay selected for a retry.
            setSelectedRows(previous => {
                const next = { ...previous }

                results
                    .filter(result => result.status !== 'failed')
                    .forEach(result => {
                        delete next[result.row.id]
                    })

                return next
            })
            setIsPayModalOpen(false)
        } finally {
            setIsPaying(false)
            approvedTimesheetsResult.mutate()
                .catch(() => undefined)
        }
    }, [approvedTimesheetsResult, selected])

    function handleEngagementChange(event: ChangeEvent<HTMLInputElement>): void {
        setEngagementInput(event.target.value)
    }

    function handleAssigneeChange(event: ChangeEvent<HTMLInputElement>): void {
        setAssigneeInput(event.target.value)
    }

    function renderBody(): JSX.Element | JSX.Element[] {
        if (!rows.length) {
            return (
                <tr>
                    <td colSpan={columnLabels.length + 1} className={styles.emptyRow}>
                        No approved timesheets found.
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
                <td>{formatHoursLeft(row.hoursLeft)}</td>
                <td className={styles.noWrap}>{formatApprovedTimesheetWorkPeriod(row)}</td>
                <td>{formatApprover(row)}</td>
                <td className={styles.notes}>{row.approvalComment || '-'}</td>
            </tr>
        ))
    }

    return (
        <div className={styles.container}>
            <div className={styles.filters}>
                <div className={styles.filterField}>
                    <label htmlFor='work-approved-timesheets-engagement-search'>Search by engagement name</label>
                    <div className={styles.searchInputWrap}>
                        <IconOutline.SearchIcon className={styles.searchIcon} />
                        <input
                            id='work-approved-timesheets-engagement-search'
                            aria-label='Search approved timesheets by engagement name'
                            className={styles.searchInput}
                            onChange={handleEngagementChange}
                            placeholder='Search by engagement name'
                            type='text'
                            value={engagementInput}
                        />
                    </div>
                </div>

                <div className={styles.filterField}>
                    <label htmlFor='work-approved-timesheets-assignee-search'>Search by assigned member</label>
                    <div className={styles.searchInputWrap}>
                        <IconOutline.SearchIcon className={styles.searchIcon} />
                        <input
                            id='work-approved-timesheets-assignee-search'
                            aria-label='Search approved timesheets by assigned member'
                            className={styles.searchInput}
                            onChange={handleAssigneeChange}
                            placeholder='Search by assigned member handle'
                            type='text'
                            value={assigneeInput}
                        />
                    </div>
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
                    label='Pay'
                    primary
                    size='md'
                    disabled={!selected.length || isPaying}
                    onClick={() => setIsPayModalOpen(true)}
                />
            </div>

            {approvedTimesheetsResult.error
                ? (
                    <ErrorMessage
                        message={approvedTimesheetsResult.error.message}
                        onRetry={() => {
                            approvedTimesheetsResult.mutate()
                                .catch(() => undefined)
                        }}
                    />
                )
                : approvedTimesheetsResult.isLoading
                    ? <LoadingSpinner />
                    : (
                        <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th className={styles.checkboxCell}>
                                            <input
                                                aria-label='Select all approved timesheets on this page'
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
                    )}

            {totalCount > 0 && !approvedTimesheetsResult.error && (
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

            <PayApprovedTimesheetsModal
                isProcessing={isPaying}
                onCancel={() => setIsPayModalOpen(false)}
                onConfirm={handlePayConfirm}
                open={isPayModalOpen}
                rows={selected}
            />
        </div>
    )
}

export default ApprovedTimesheetsTab
