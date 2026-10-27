/* eslint-disable react/jsx-no-bind */

import {
    ChangeEvent,
    FC,
    MouseEvent,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { Link } from 'react-router-dom'
import Select, { SingleValue } from 'react-select'
import classNames from 'classnames'

import { IconOutline } from '~/libs/ui'

import { rootRoute } from '../../../config/routes.config'
import {
    ENGAGEMENTS_APP_URL,
    PAGE_SIZE,
} from '../../constants'
import {
    Assignment,
    Engagement,
} from '../../models'
import {
    formatDate,
    getAssignmentPaymentCycle,
    normalizeAssignmentStatus,
} from '../../utils'
import { Pagination } from '../Pagination'

import styles from './EngagementAssignmentsTable.module.scss'

/**
 * One assignment together with the engagement and project it belongs to. The page resolves the
 * project, since it already knows how to name projects the engagement payload leaves out.
 */
export interface EngagementAssignmentRow {
    assignment: Assignment
    /** Customer from the project details; empty when the project names none. */
    customerName: string
    engagement: Engagement
    projectId: string
    projectName: string
}

interface EngagementAssignmentsTableProps {
    /** Where the assignment pages should send the user back to. */
    backUrl: string
    rows: EngagementAssignmentRow[]
}

interface SelectOption {
    label: string
    value: string
}

const ALL_STATUSES_VALUE = 'all'

const STATUS_OPTIONS: SelectOption[] = [
    {
        label: 'All',
        value: ALL_STATUSES_VALUE,
    },
    ...['SELECTED', 'ASSIGNED', 'COMPLETED', 'TERMINATED', 'OFFER_REJECTED'].map(status => ({
        label: normalizeAssignmentStatus(status),
        value: status,
    })),
]

type SortField = 'endDate' | 'lastPaidAt' | 'paymentCycle' | 'startDate'

type SortOrder = 'asc' | 'desc'

interface ColumnDefinition {
    label: string
    sortField?: SortField
}

const columns: ColumnDefinition[] = [
    { label: 'Member' },
    { label: 'Customer Name' },
    { label: 'Engagement Title' },
    { label: 'Status' },
    { label: 'Start Date', sortField: 'startDate' },
    { label: 'End Date', sortField: 'endDate' },
    { label: 'Last Paid Date', sortField: 'lastPaidAt' },
    { label: 'Payment Cycle', sortField: 'paymentCycle' },
    { label: 'Actions' },
]

/** Shortest cycle first, so ascending reads weekly, fortnightly, monthly. */
const PAYMENT_CYCLE_ORDER: Record<string, number> = {
    FORTNIGHTLY: 2,
    MONTHLY: 3,
    WEEKLY: 1,
}

function normalizeStatus(status: unknown): string {
    return String(status || '')
        .trim()
        .toUpperCase()
}

/**
 * True for assignments that have, or had, a timesheet: the member is working now, or did work that
 * may still need reviewing or paying. A selected or rejected offer never logged hours.
 */
function hasTimesheet(status: string): boolean {
    return ['ASSIGNED', 'COMPLETED', 'TERMINATED'].includes(normalizeStatus(status))
}

function getStatusPillClass(status: string): string {
    const normalizedStatus = normalizeStatus(status)

    if (normalizedStatus === 'ASSIGNED') {
        return styles.statusGreen
    }

    if (normalizedStatus === 'SELECTED') {
        return styles.statusYellow
    }

    if (normalizedStatus === 'COMPLETED') {
        return styles.statusBlue
    }

    if (normalizedStatus === 'TERMINATED' || normalizedStatus === 'OFFER_REJECTED') {
        return styles.statusRed
    }

    return styles.statusGray
}

function formatPaymentCycle(assignment: Assignment): string {
    return normalizeAssignmentStatus(getAssignmentPaymentCycle(assignment))
}

function toTimestamp(value?: string): number | undefined {
    const timestamp = value ? new Date(value)
        .getTime() : Number.NaN

    return Number.isNaN(timestamp) ? undefined : timestamp
}

function getSortValue(row: EngagementAssignmentRow, sortField: SortField): number | undefined {
    if (sortField === 'paymentCycle') {
        return PAYMENT_CYCLE_ORDER[normalizeStatus(getAssignmentPaymentCycle(row.assignment))]
    }

    return toTimestamp(row.assignment[sortField])
}

/** Sorts by the given field; rows without a value go last in either direction. */
function sortRows(
    rows: EngagementAssignmentRow[],
    sortField: SortField,
    sortOrder: SortOrder,
): EngagementAssignmentRow[] {
    const direction = sortOrder === 'asc' ? 1 : -1

    return [...rows].sort((rowA, rowB) => {
        const valueA = getSortValue(rowA, sortField)
        const valueB = getSortValue(rowB, sortField)

        if (valueA === undefined || valueB === undefined) {
            return (valueA === undefined ? 1 : 0) - (valueB === undefined ? 1 : 0)
        }

        return (valueA - valueB) * direction
    })
}

function matchesText(value: string, filter: string): boolean {
    return !filter || value.toLowerCase()
        .includes(filter)
}

function renderRow(row: EngagementAssignmentRow, backUrl: string): JSX.Element {
    const { assignment, customerName, engagement, projectId, projectName }: EngagementAssignmentRow = row
    const status = String(assignment.status || '')
    const assignmentsRoute = projectId && engagement.id
        ? `${rootRoute}/projects/${projectId}/engagements/${engagement.id}/assignments`
        : undefined
    const engagementDetailsRoute = projectId && engagement.id
        ? `${rootRoute}/projects/${projectId}/engagements/${engagement.id}/view`
        : undefined

    return (
        <tr key={`${engagement.id}-${assignment.id}`}>
            <td className={styles.memberHandle}>{assignment.memberHandle || '-'}</td>
            <td className={styles.customerName}>{customerName || '-'}</td>
            <td className={styles.engagementTitle}>
                {engagementDetailsRoute
                    ? (
                        <Link className={styles.link} to={engagementDetailsRoute}>
                            {engagement.title || '-'}
                        </Link>
                    )
                    : engagement.title || '-'}
            </td>
            <td>
                <span className={classNames(styles.statusPill, getStatusPillClass(status))}>
                    {normalizeAssignmentStatus(status) || '-'}
                </span>
            </td>
            <td>{formatDate(assignment.startDate)}</td>
            <td>{formatDate(assignment.endDate)}</td>
            <td>{formatDate(assignment.lastPaidAt)}</td>
            <td>{formatPaymentCycle(assignment)}</td>
            <td>
                <div className={styles.actions}>
                    {assignmentsRoute
                        ? (
                            <Link
                                className={styles.actionLink}
                                state={{ backUrl }}
                                to={assignmentsRoute}
                            >
                                Manage
                            </Link>
                        )
                        : undefined}
                    {hasTimesheet(status) && engagement.id && assignment.id
                        ? (
                            <a
                                className={styles.actionLink}
                                href={`${ENGAGEMENTS_APP_URL}/${engagement.id}/timesheets/${assignment.id}`}
                                rel='noreferrer noopener'
                                target='_blank'
                            >
                                Timesheet
                                <IconOutline.ExternalLinkIcon
                                    aria-hidden='true'
                                    className={styles.externalIcon}
                                />
                            </a>
                        )
                        : undefined}
                    {projectId
                        ? (
                            <Link
                                className={styles.actionLink}
                                title={projectName || undefined}
                                to={`${rootRoute}/projects/${projectId}/challenges`}
                            >
                                Project
                            </Link>
                        )
                        : undefined}
                </div>
            </td>
        </tr>
    )
}

/**
 * Every assignment across the engagements the caller can see, one row per assignment.
 *
 * Filters run client-side over rows the page already loaded, so the caller's access is whatever
 * scoped the engagement fetch: everything for an administrator, the projects they belong to for a
 * Talent Manager.
 */
export const EngagementAssignmentsTable: FC<EngagementAssignmentsTableProps> = (
    props: EngagementAssignmentsTableProps,
) => {
    const [status, setStatus] = useState<string>(ALL_STATUSES_VALUE)
    const [projectNameInput, setProjectNameInput] = useState<string>('')
    const [engagementTitleInput, setEngagementTitleInput] = useState<string>('')
    const [page, setPage] = useState<number>(1)
    const [perPage, setPerPage] = useState<number>(PAGE_SIZE)
    const [sortField, setSortField] = useState<SortField | undefined>(undefined)
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

    const filteredRows = useMemo(() => {
        const projectNameFilter = projectNameInput.trim()
            .toLowerCase()
        const engagementTitleFilter = engagementTitleInput.trim()
            .toLowerCase()

        const rows = props.rows
            .filter(row => status === ALL_STATUSES_VALUE
                || normalizeStatus(row.assignment.status) === status)
            .filter(row => matchesText(row.projectName, projectNameFilter)
                || matchesText(row.projectId, projectNameFilter)
                || matchesText(row.customerName, projectNameFilter))
            .filter(row => matchesText(String(row.engagement.title || ''), engagementTitleFilter))

        return sortField ? sortRows(rows, sortField, sortOrder) : rows
    }, [engagementTitleInput, projectNameInput, props.rows, sortField, sortOrder, status])

    const paginatedRows = useMemo(() => {
        const start = (page - 1) * perPage

        return filteredRows.slice(start, start + perPage)
    }, [filteredRows, page, perPage])

    useEffect(() => {
        const totalPages = Math.max(1, Math.ceil(filteredRows.length / perPage))

        if (page > totalPages) {
            setPage(totalPages)
        }
    }, [filteredRows.length, page, perPage])

    const selectedStatus = STATUS_OPTIONS.find(option => option.value === status)

    function handleStatusChange(nextOption: SingleValue<SelectOption>): void {
        setStatus(nextOption?.value || ALL_STATUSES_VALUE)
        setPage(1)
    }

    function handleProjectNameChange(event: ChangeEvent<HTMLInputElement>): void {
        setProjectNameInput(event.target.value)
        setPage(1)
    }

    function handleEngagementTitleChange(event: ChangeEvent<HTMLInputElement>): void {
        setEngagementTitleInput(event.target.value)
        setPage(1)
    }

    function handleSortClick(event: MouseEvent<HTMLButtonElement>): void {
        const nextSortField = event.currentTarget.dataset.sortField as SortField | undefined

        if (!nextSortField) {
            return
        }

        setSortOrder(nextSortField === sortField && sortOrder === 'asc' ? 'desc' : 'asc')
        setSortField(nextSortField)
        setPage(1)
    }

    function renderHeader(column: ColumnDefinition): JSX.Element {
        if (!column.sortField) {
            return <th key={column.label}>{column.label}</th>
        }

        const isSorted = column.sortField === sortField

        return (
            <th
                aria-sort={isSorted ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
                key={column.label}
            >
                <button
                    className={styles.sortButton}
                    data-sort-field={column.sortField}
                    onClick={handleSortClick}
                    type='button'
                >
                    {column.label}
                    {isSorted ? (sortOrder === 'asc' ? ' \u2191' : ' \u2193') : ''}
                </button>
            </th>
        )
    }

    return (
        <div className={styles.container}>
            <div className={styles.filters}>
                <div className={styles.filterField}>
                    <label htmlFor='work-assignments-project-search'>Search by project or customer</label>
                    <div className={styles.searchInputWrap}>
                        <IconOutline.SearchIcon className={styles.searchIcon} />
                        <input
                            id='work-assignments-project-search'
                            aria-label='Search assignments by project or customer name'
                            className={styles.searchInput}
                            onChange={handleProjectNameChange}
                            placeholder='Search by project or customer'
                            type='text'
                            value={projectNameInput}
                        />
                    </div>
                </div>

                <div className={styles.filterField}>
                    <label htmlFor='work-assignments-engagement-search'>Search by engagement name</label>
                    <div className={styles.searchInputWrap}>
                        <IconOutline.SearchIcon className={styles.searchIcon} />
                        <input
                            id='work-assignments-engagement-search'
                            aria-label='Search assignments by engagement name'
                            className={styles.searchInput}
                            onChange={handleEngagementTitleChange}
                            placeholder='Search by engagement name'
                            type='text'
                            value={engagementTitleInput}
                        />
                    </div>
                </div>

                <div className={styles.filterField}>
                    <label htmlFor='work-assignments-status'>Status</label>
                    <Select<SelectOption, false>
                        inputId='work-assignments-status'
                        className='react-select-container'
                        classNamePrefix='select'
                        options={STATUS_OPTIONS}
                        value={selectedStatus}
                        onChange={handleStatusChange}
                        isClearable={false}
                    />
                </div>
            </div>

            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            {columns.map(renderHeader)}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedRows.length
                            ? paginatedRows.map(row => renderRow(row, props.backUrl))
                            : (
                                <tr>
                                    <td colSpan={columns.length} className={styles.emptyRow}>
                                        No assignments found.
                                    </td>
                                </tr>
                            )}
                    </tbody>
                </table>
            </div>

            {filteredRows.length > 0 && (
                <Pagination
                    page={page}
                    perPage={perPage}
                    total={filteredRows.length}
                    itemLabel='assignments'
                    onPageChange={setPage}
                    onPerPageChange={nextPerPage => {
                        setPerPage(nextPerPage)
                        setPage(1)
                    }}
                />
            )}
        </div>
    )
}

export default EngagementAssignmentsTable
