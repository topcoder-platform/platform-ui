import { ChangeEvent, FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { debounce } from 'lodash'
import { useNavigate } from 'react-router-dom'

import {
    Button,
    ContentLayout,
    InputDatePicker,
    InputSelect,
    InputText,
} from '~/libs/ui'

import type { TimesheetEngagementRow, TimesheetRollupStatus } from '../../lib/models'
import { TimesheetEntryStatus, TimesheetViewerRole } from '../../lib/models'
import { getTimesheetEngagements } from '../../lib/services'
import {
    TIMESHEET_REVIEW_STATUS_PARAM,
    toWorkDateString,
    validateDateRange,
} from '../../lib/utils'
import { AuthCtx, useAuth } from '../../lib/utils/auth'
import { rootRoute } from '../../engagements.routes'
import { EngagementsTabs, StatusBadge } from '../../components'

import styles from './TimesheetsPage.module.scss'

const PER_PAGE = 20

const TIMESHEET_STATUS_OPTIONS = [
    { label: 'All', value: '' },
    { label: 'Pending Approval', value: 'Pending Approval' },
    { label: 'Approved', value: 'Approved' },
]

interface Filters {
    assignee: string
    /** `YYYY-MM-DD`; administrators only. */
    fromDate: string
    manager: string
    status: string
    title: string
    /** `YYYY-MM-DD`; administrators only. */
    toDate: string
}

/**
 * A manager's empty list says what was actually looked for. The default view is Pending Approval, so
 * an empty list usually means nothing is waiting - not that the manager has no engagements.
 */
const getManagerEmptyMessage = (filters: Filters): string => {
    if (filters.title.trim() || filters.assignee.trim()) {
        return 'No timesheets match these filters.'
    }

    switch (filters.status) {
        case 'Pending Approval':
            return 'You have no timesheets in pending approval status.'
        case 'Approved':
            return 'You have no approved timesheets.'
        default:
            return 'You have no timesheets to review.'
    }
}

const EMPTY_FILTERS: Filters = {
    assignee: '',
    fromDate: '',
    manager: '',
    status: 'Pending Approval',
    title: '',
    toDate: '',
}

/**
 * Administrators oversee every timesheet, so their list opens on All. Managers and TMs come here to
 * clear what is waiting, so theirs opens on Pending Approval.
 */
const getDefaultFilters = (isAdmin: boolean): Filters => (
    isAdmin ? { ...EMPTY_FILTERS, status: '' } : EMPTY_FILTERS
)

const toPickerDate = (value: string): Date | undefined => {
    if (!value) {
        return undefined
    }

    const [year, month, day] = value.split('-')
        .map(Number)

    return new Date(year, month - 1, day)
}

/**
 * The landing list for managers and administrators: one row per (engagement, assignee).
 *
 * Which columns and filters appear follows the `viewerRole` the API reports, not the caller's JWT
 * roles - and because it comes back in the response meta, an empty list still knows which view it is.
 */
const TimesheetEngagementsPage: FC = () => {
    const navigate = useNavigate()
    // The default status has to be picked before the first request, which is before the API reports
    // `viewerRole` - so it comes from the caller's roles. Everything else still follows viewerRole.
    const authCtx: AuthCtx = useAuth()
    const isAdmin = authCtx.isAdmin
    const isStatusTouchedRef = useRef<boolean>(false)

    const [rows, setRows] = useState<TimesheetEngagementRow[]>([])
    const [viewerRole, setViewerRole] = useState<TimesheetViewerRole | undefined>()
    const [page, setPage] = useState<number>(1)
    const [totalPages, setTotalPages] = useState<number>(1)
    const [totalCount, setTotalCount] = useState<number>(0)
    const [filters, setFilters] = useState<Filters>(() => getDefaultFilters(isAdmin))
    const [appliedFilters, setAppliedFilters] = useState<Filters>(() => getDefaultFilters(isAdmin))
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | undefined>()

    const isAdministrator = viewerRole === TimesheetViewerRole.ADMINISTRATOR
    const isTm = viewerRole === TimesheetViewerRole.TM
    const dateRangeError = validateDateRange(filters.fromDate, filters.toDate)

    // A manager reviews people rather than engagements, so their list leads with the assignee and
    // shows where each assignment stands instead of the rolled-up timesheet status.
    const isManagerList = !isAdministrator && !isTm
    let columnCount = 3
    if (isAdministrator) {
        columnCount = 4
    } else if (isManagerList) {
        columnCount = 5
    }

    const emptyStateMessage = isAdministrator
        ? 'No timesheets match these filters.'
        : isTm
            ? 'No submitted timesheets match these filters.'
            : getManagerEmptyMessage(appliedFilters)

    useEffect(() => {
        let mounted = true

        const load = async (): Promise<void> => {
            setIsLoading(true)

            try {
                const response = await getTimesheetEngagements({
                    assignee: appliedFilters.assignee || undefined,
                    fromDate: appliedFilters.fromDate || undefined,
                    manager: appliedFilters.manager || undefined,
                    page,
                    perPage: PER_PAGE,
                    status: (appliedFilters.status || undefined) as TimesheetRollupStatus | undefined,
                    title: appliedFilters.title || undefined,
                    toDate: appliedFilters.toDate || undefined,
                })

                if (mounted) {
                    setRows(response.data)
                    setViewerRole(response.meta.viewerRole)
                    setTotalPages(response.meta.totalPages)
                    setTotalCount(response.meta.totalCount)
                    setError(undefined)
                }
            } catch (loadError) {
                if (mounted) {
                    setError('Failed to load timesheets. Please try again.')
                }
            } finally {
                if (mounted) {
                    setIsLoading(false)
                }
            }
        }

        load()

        return () => {
            mounted = false
        }
    }, [appliedFilters, page])

    // The profile can arrive after the first render. Once it shows an administrator, move to their
    // default - unless they already picked a status themselves.
    useEffect(() => {
        if (!isAdmin || isStatusTouchedRef.current) {
            return
        }

        setFilters(current => ({ ...current, status: '' }))
    }, [isAdmin])

    const handleFilterChange = useCallback((
        field: keyof Filters,
    ) => function onFilterChange(event: ChangeEvent<HTMLInputElement>) {
        if (field === 'status') {
            isStatusTouchedRef.current = true
        }

        setFilters(current => ({ ...current, [field]: event.target.value }))
    }, [])

    const handleDateChange = useCallback((
        field: 'fromDate' | 'toDate',
    ) => function onDateChange(date: Date | null) {
        setFilters(current => ({ ...current, [field]: date ? toWorkDateString(date) : '' }))
    }, [])

    const handleFilterBlur = useCallback(() => undefined, [])

    const debouncedApplyFilters = useMemo(
        () => debounce((nextFilters: Filters) => {
            setPage(1)
            setAppliedFilters(nextFilters)
        }, 300),
        [],
    )

    useEffect(() => {
        // An inverted range is shown as an error and never sent.
        if (validateDateRange(filters.fromDate, filters.toDate)) {
            debouncedApplyFilters.cancel()
            return undefined
        }

        debouncedApplyFilters(filters)

        return () => {
            debouncedApplyFilters.cancel()
        }
    }, [debouncedApplyFilters, filters])

    const handleClearFilters = useCallback(() => {
        const defaults = getDefaultFilters(isAdmin)

        isStatusTouchedRef.current = false
        setPage(1)
        setFilters(defaults)
        setAppliedFilters(defaults)
    }, [isAdmin])

    // Open the timesheet on the status the list was filtered by. Under "All" the row's own rollup is
    // the best guide to what the user came to look at.
    const openTimesheet = useCallback((row: TimesheetEngagementRow) => {
        const listStatus = appliedFilters.status || row.timesheetStatus
        const reviewStatus = listStatus === 'Approved'
            ? TimesheetEntryStatus.APPROVED
            : TimesheetEntryStatus.SUBMITTED
        const query = new URLSearchParams({ [TIMESHEET_REVIEW_STATUS_PARAM]: reviewStatus })

        navigate(`${rootRoute}/${row.engagementId}/timesheets/${row.assignmentId}?${query.toString()}`)
    }, [appliedFilters.status, navigate])

    const assigneeLabel = useMemo(() => (row: TimesheetEngagementRow): string => (
        row.assigneeName ? `${row.assigneeName} (${row.assigneeHandle})` : row.assigneeHandle
    ), [])

    const skeletonRows = useMemo(() => Array.from({ length: 4 }, (_, index) => index), [])

    return (
        <ContentLayout title='Timesheets'>
            <EngagementsTabs activeTab='timesheets' />
            <div className={styles.page}>
                <section className={styles.filters}>
                    <div className={styles.filterGrid}>
                        <div className={styles.field}>
                            <InputText
                                dirty
                                forceUpdateValue
                                label='Engagement title'
                                name='title'
                                placeholder='Enter engagement title'
                                type='text'
                                value={filters.title}
                                onBlur={handleFilterBlur}
                                onChange={handleFilterChange('title')}
                                tabIndex={0}
                            />
                        </div>
                        <div className={styles.field}>
                            <InputText
                                type='text'
                                dirty
                                forceUpdateValue
                                name='assignee'
                                label='Assignee'
                                placeholder='Enter assignee'
                                value={filters.assignee}
                                onBlur={handleFilterBlur}
                                onChange={handleFilterChange('assignee')}
                                tabIndex={0}
                            />
                        </div>
                        {isAdministrator && (
                            <div className={styles.field}>
                                <InputText
                                    type='text'
                                    dirty
                                    forceUpdateValue
                                    name='manager'
                                    label='Manager'
                                    placeholder='Enter manager'
                                    value={filters.manager}
                                    onBlur={handleFilterBlur}
                                    onChange={handleFilterChange('manager')}
                                    tabIndex={0}
                                />
                            </div>
                        )}
                        <div className={styles.field}>
                            <InputSelect
                                dirty
                                name='status'
                                label='Status'
                                placeholder='Select status'
                                value={filters.status}
                                onChange={handleFilterChange('status')}
                                options={TIMESHEET_STATUS_OPTIONS}
                                tabIndex={0}
                                classNameWrapper={styles.selectFilter}
                            />
                        </div>
                        {isAdministrator && (
                            <>
                                <div className={styles.field}>
                                    <InputDatePicker
                                        className={styles.dateFilter}
                                        classNameWrapper={styles.dateFilterWrapper}
                                        date={toPickerDate(filters.fromDate)}
                                        disabled={false}
                                        isClearable
                                        label='From Date'
                                        onChange={handleDateChange('fromDate')}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <InputDatePicker
                                        className={styles.dateFilter}
                                        classNameWrapper={styles.dateFilterWrapper}
                                        date={toPickerDate(filters.toDate)}
                                        disabled={false}
                                        isClearable
                                        label='To Date'
                                        onChange={handleDateChange('toDate')}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                    {dateRangeError && (
                        <p className={styles.error} role='alert'>{dateRangeError}</p>
                    )}
                    <div className={styles.filterActions}>
                        <Button label='Clear Filters' onClick={handleClearFilters} secondary />
                    </div>
                </section>

                {isLoading && (
                    <div className={styles.loadingState}>
                        <table className={styles.listTable}>
                            <thead>
                                <tr>
                                    <td
                                        colSpan={columnCount}
                                    >
                                        Loading engagement timesheets...
                                    </td>
                                </tr>
                            </thead>
                            <tbody>
                                {skeletonRows.map(index => (
                                    <tr key={`timesheet-skeleton-${index}`}>
                                        {Array.from({ length: columnCount - 1 }, (_, cell) => (
                                            <td key={`timesheet-skeleton-${index}-${cell}`}>
                                                <div className={styles.skeletonCell} aria-label='loading cell' />
                                            </td>
                                        ))}
                                        <td><div className={styles.skeletonAction} aria-label='loading cell' /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!isLoading && error && (
                    <p className={styles.error} role='alert'>{error}</p>
                )}

                {!isLoading && !error && rows.length === 0 && (
                    <p className={styles.pending}>
                        {emptyStateMessage}
                    </p>
                )}

                {!isLoading && !error && rows.length > 0 && (
                    <>
                        {isManagerList ? (
                            <table className={styles.listTable}>
                                <thead>
                                    <tr>
                                        <th scope='col'>Assignee</th>
                                        <th scope='col'>Engagement</th>
                                        <th scope='col'>Assignment Status</th>
                                        <th scope='col' data-label='Approval Status Col' />
                                        <th scope='col'>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map(row => (
                                        <tr key={row.assignmentId}>
                                            <td data-label='Assignee'>{assigneeLabel(row)}</td>
                                            <td data-label='Engagement'>{row.engagementTitle}</td>
                                            <td data-label='Assignment Status'>
                                                <StatusBadge size='sm' status={row.assignmentStatus} />
                                            </td>
                                            <td data-label='Approval Status'>
                                                {row.hasPendingApproval
                                                    ? (
                                                        <StatusBadge
                                                            label='Pending approval'
                                                            size='sm'
                                                            status='pending_approval'
                                                        />
                                                    )
                                                    : ''}
                                            </td>
                                            <td data-label='Action'>
                                                <Button
                                                    label='View'
                                                    onClick={function onView() {
                                                        openTimesheet(row)
                                                    }}
                                                    secondary
                                                    size='sm'
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <table className={styles.listTable}>
                                <thead>
                                    <tr>
                                        <th scope='col'>Engagement Title</th>
                                        <th scope='col'>Assignee</th>
                                        {(isAdministrator || isTm) && <th scope='col'>Timesheet Status</th>}
                                        <th scope='col'>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map(row => (
                                        <tr key={row.assignmentId}>
                                            <td data-label='Engagement Title'>{row.engagementTitle}</td>
                                            <td data-label='Assignee'>{assigneeLabel(row)}</td>
                                            {(isAdministrator || isTm) && (
                                                <td data-label='Timesheet Status'>{row.timesheetStatus}</td>
                                            )}
                                            <td data-label='Action'>
                                                <Button
                                                    label='View'
                                                    onClick={function onView() {
                                                        openTimesheet(row)
                                                    }}
                                                    secondary
                                                    size='sm'
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {totalPages > 1 && (
                            <div className={styles.pagination}>
                                <Button
                                    disabled={page <= 1}
                                    label='Previous'
                                    onClick={function onPrevious() {
                                        setPage(current => Math.max(1, current - 1))
                                    }}
                                    secondary
                                    size='sm'
                                />
                                <span>
                                    {`Page ${page} of ${totalPages} (${totalCount} rows)`}
                                </span>
                                <Button
                                    disabled={page >= totalPages}
                                    label='Next'
                                    onClick={function onNext() {
                                        setPage(current => Math.min(totalPages, current + 1))
                                    }}
                                    secondary
                                    size='sm'
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </ContentLayout>
    )
}

export default TimesheetEngagementsPage
