import { ChangeEvent, FC, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button, ContentLayout, LoadingSpinner } from '~/libs/ui'

import type { TimesheetEngagementRow, TimesheetRollupStatus } from '../../lib/models'
import { TimesheetViewerRole } from '../../lib/models'
import { getTimesheetEngagements } from '../../lib/services'
import { rootRoute } from '../../engagements.routes'
import { EngagementsTabs } from '../../components'

import styles from './TimesheetsPage.module.scss'

const PER_PAGE = 20

interface Filters {
    assignee: string
    manager: string
    status: string
    title: string
}

const EMPTY_FILTERS: Filters = {
    assignee: '',
    manager: '',
    status: 'Pending Approval',
    title: '',
}

/**
 * The landing list for managers and administrators: one row per (engagement, assignee).
 *
 * Which columns and filters appear follows the `viewerRole` the API reports, not the caller's JWT
 * roles - and because it comes back in the response meta, an empty list still knows which view it is.
 */
const TimesheetEngagementsPage: FC = () => {
    const navigate = useNavigate()

    const [rows, setRows] = useState<TimesheetEngagementRow[]>([])
    const [viewerRole, setViewerRole] = useState<TimesheetViewerRole | undefined>()
    const [page, setPage] = useState<number>(1)
    const [totalPages, setTotalPages] = useState<number>(1)
    const [totalCount, setTotalCount] = useState<number>(0)
    const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
    const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | undefined>()

    const isAdministrator = viewerRole === TimesheetViewerRole.ADMINISTRATOR

    useEffect(() => {
        let mounted = true

        const load = async (): Promise<void> => {
            setIsLoading(true)

            try {
                const response = await getTimesheetEngagements({
                    assignee: appliedFilters.assignee || undefined,
                    manager: appliedFilters.manager || undefined,
                    page,
                    perPage: PER_PAGE,
                    status: (appliedFilters.status || undefined) as TimesheetRollupStatus | undefined,
                    title: appliedFilters.title || undefined,
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

    const handleFilterChange = useCallback((
        field: keyof Filters,
    ) => function onFilterChange(event: ChangeEvent<HTMLInputElement & HTMLSelectElement>) {
        setFilters(current => ({ ...current, [field]: event.target.value }))
    }, [])

    const handleApplyFilters = useCallback(() => {
        setPage(1)
        setAppliedFilters(filters)
    }, [filters])

    const handleClearFilters = useCallback(() => {
        setPage(1)
        setFilters(EMPTY_FILTERS)
        setAppliedFilters(EMPTY_FILTERS)
    }, [])

    const openTimesheet = useCallback((row: TimesheetEngagementRow) => {
        navigate(`${rootRoute}/${row.engagementId}/timesheets/${row.assignmentId}`)
    }, [navigate])

    const assigneeLabel = useMemo(() => (row: TimesheetEngagementRow): string => (
        row.assigneeName ? `${row.assigneeName} (${row.assigneeHandle})` : row.assigneeHandle
    ), [])

    return (
        <ContentLayout title='Timesheets'>
            <EngagementsTabs activeTab='timesheets' />
            <div className={styles.page}>
                <section className={styles.filters}>
                    <label htmlFor='timesheet-filter-title'>
                        Engagement title
                        <input
                            id='timesheet-filter-title'
                            onChange={handleFilterChange('title')}
                            type='text'
                            value={filters.title}
                        />
                    </label>
                    <label htmlFor='timesheet-filter-assignee'>
                        Assignee
                        <input
                            id='timesheet-filter-assignee'
                            onChange={handleFilterChange('assignee')}
                            type='text'
                            value={filters.assignee}
                        />
                    </label>
                    {isAdministrator && (
                        <label htmlFor='timesheet-filter-manager'>
                            Manager
                            <input
                                id='timesheet-filter-manager'
                                onChange={handleFilterChange('manager')}
                                type='text'
                                value={filters.manager}
                            />
                        </label>
                    )}
                    <label htmlFor='timesheet-filter-status'>
                        Timesheet status
                        <select
                            id='timesheet-filter-status'
                            onChange={handleFilterChange('status')}
                            value={filters.status}
                        >
                            <option value=''>All</option>
                            <option value='Pending Approval'>Pending Approval</option>
                            <option value='Approved'>Approved</option>
                        </select>
                    </label>
                    <div className={styles.filterActions}>
                        <Button label='Apply' onClick={handleApplyFilters} primary size='sm' />
                        <Button label='Clear' onClick={handleClearFilters} secondary size='sm' />
                    </div>
                </section>

                {isLoading && <LoadingSpinner />}

                {!isLoading && error && (
                    <p className={styles.error} role='alert'>{error}</p>
                )}

                {!isLoading && !error && rows.length === 0 && (
                    <p className={styles.pending}>
                        No timesheets match these filters.
                    </p>
                )}

                {!isLoading && !error && rows.length > 0 && (
                    <>
                        <table className={styles.listTable}>
                            <thead>
                                <tr>
                                    <th scope='col'>Engagement Title</th>
                                    <th scope='col'>Assignee</th>
                                    {isAdministrator && <th scope='col'>Timesheet Status</th>}
                                    <th scope='col'>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(row => (
                                    <tr key={row.assignmentId}>
                                        <td data-label='Engagement Title'>{row.engagementTitle}</td>
                                        <td data-label='Assignee'>{assigneeLabel(row)}</td>
                                        {isAdministrator && (
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
