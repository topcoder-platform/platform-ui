/** General Topcoder site engagement dashboard. */
import {
    ChangeEvent,
    FC,
    FormEvent,
    useCallback,
    useMemo,
    useState,
} from 'react'

import {
    Button,
    IconOutline,
    PageTitle,
} from '~/libs/ui'

import {
    AnalyticsLoadingState,
    MetricCard,
    ReportError,
    TimeSeriesChart,
} from '../lib/components'
import { useAnalyticsResource } from '../lib/hooks'
import {
    AnalyticsFilterOptions,
    GeneralFilters,
    GeneralReport,
} from '../lib/models'
import {
    getAnalyticsFilters,
    getGeneralReport,
} from '../lib/services'
import {
    analyticsRequestKey,
    defaultAnalyticsDateRange,
    formatAnalyticsFreshness,
    formatAnalyticsInteger,
    formatAnalyticsSurface,
    validateAnalyticsDateRange,
} from '../lib/utils'

import styles from './AnalyticsPages.module.scss'

const MOST_VISITED_PAGE_SIZE = 20
const pageViewSeries = [{ color: '#2c5de5', key: 'pageViews', label: 'Page views' }]
const visitorSeries = [{ color: '#6f42c1', key: 'visitors', label: 'Unique visitors' }]
const clickSeries = [{ color: '#137d60', key: 'clicks', label: 'Clicks' }]

/**
 * Creates the complete default general analytics filter state.
 *
 * @returns thirty-day range across every surface.
 * @throws Does not throw.
 */
function initialGeneralFilters(): GeneralFilters {
    return { ...defaultAnalyticsDateRange(), surface: '' }
}

/**
 * Renders a consistent empty message spanning a general analytics table.
 *
 * @param props number of table columns spanned by the message.
 * @returns table row empty state.
 * @throws Does not throw.
 */
const EmptyTableRow: FC<{ columns: number }> = props => (
    <tr>
        <td className={styles.emptyTable} colSpan={props.columns}>
            No data matches these filters.
        </td>
    </tr>
)

interface AnalyticsTablePaginationProps {
    onNext: () => void
    onPrevious: () => void
    page: number
    pageSize: number
    total: number
    totalPages: number
}

/**
 * Renders compact previous/next controls and the visible range for a local analytics table.
 *
 * @param props current page metadata and stable navigation callbacks.
 * @returns accessible pagination summary and controls.
 * @throws Does not throw.
 */
const AnalyticsTablePagination: FC<AnalyticsTablePaginationProps> = props => {
    const start = props.total === 0 ? 0 : ((props.page - 1) * props.pageSize) + 1
    const end = Math.min(props.total, props.page * props.pageSize)

    return (
        <div className={styles.pagination}>
            <span>{`Showing ${start}–${end} of ${props.total} pages`}</span>
            <nav aria-label='Most visited pages pagination'>
                <button
                    disabled={props.page <= 1}
                    onClick={props.onPrevious}
                    type='button'
                >
                    Previous
                </button>
                <span>{`Page ${props.page} of ${props.totalPages}`}</span>
                <button
                    disabled={props.page >= props.totalPages}
                    onClick={props.onNext}
                    type='button'
                >
                    Next
                </button>
            </nav>
        </div>
    )
}

/**
 * Renders general totals, separate daily charts, and paginated page/source tables.
 *
 * @returns role-gated General Analytics page.
 * @throws Does not throw; request failures are rendered inline.
 */
export const GeneralAnalyticsPage: FC = () => {
    const initialFilters = useMemo(initialGeneralFilters, [])
    const [draftFilters, setDraftFilters] = useState<GeneralFilters>(initialFilters)
    const [appliedFilters, setAppliedFilters] = useState<GeneralFilters>(initialFilters)
    const [filterError, setFilterError] = useState<string>()
    const [visitedPagesPage, setVisitedPagesPage] = useState(1)
    const filterOptions = useAnalyticsResource<AnalyticsFilterOptions>('analytics-filters', getAnalyticsFilters)
    const reportKey = analyticsRequestKey('general', appliedFilters)
    const report = useAnalyticsResource<GeneralReport>(
        reportKey,
        useCallback(() => getGeneralReport(appliedFilters), [appliedFilters]),
    )

    const updateFilter = useCallback((event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value }: { name: string; value: string } = event.target
        setDraftFilters(current => ({ ...current, [name]: value }))
    }, [])
    const applyFilters = useCallback((event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const error = validateAnalyticsDateRange(draftFilters)
        setFilterError(error)
        if (!error) {
            setAppliedFilters({ ...draftFilters })
            setVisitedPagesPage(1)
        }
    }, [draftFilters])
    const resetFilters = useCallback(() => {
        const next = initialGeneralFilters()
        setDraftFilters(next)
        setAppliedFilters(next)
        setVisitedPagesPage(1)
        setFilterError(undefined)
    }, [])

    const data = report.data
    const reportPending = report.loading || report.refreshing
    const visitedPagesTotal = data?.pages.length ?? 0
    const visitedPagesTotalPages = Math.max(
        1,
        Math.ceil(visitedPagesTotal / MOST_VISITED_PAGE_SIZE),
    )
    const activeVisitedPagesPage = Math.min(visitedPagesPage, visitedPagesTotalPages)
    const visibleVisitedPages = data?.pages.slice(
        (activeVisitedPagesPage - 1) * MOST_VISITED_PAGE_SIZE,
        activeVisitedPagesPage * MOST_VISITED_PAGE_SIZE,
    ) ?? []
    const showPreviousVisitedPages = useCallback(() => {
        setVisitedPagesPage(current => Math.max(1, current - 1))
    }, [])
    const showNextVisitedPages = useCallback(() => {
        setVisitedPagesPage(current => Math.min(visitedPagesTotalPages, current + 1))
    }, [visitedPagesTotalPages])
    const reportingPeriod = `${formatAnalyticsFreshness(appliedFilters.from)} – ${
        formatAnalyticsFreshness(appliedFilters.to)}`
    return (
        <>
            <PageTitle>General Analytics</PageTitle>
            <div className={styles.page}>
                <header className={styles.pageHeader}>
                    <div>
                        <p className={styles.eyebrow}>Topcoder.com engagement</p>
                        <h1>General site analytics</h1>
                        <p>See traffic, visitors, clicks, and the pages people visit over time.</p>
                    </div>
                    <Button
                        disabled={report.loading || report.refreshing}
                        icon={IconOutline.RefreshIcon}
                        iconToLeft
                        onClick={report.refresh}
                        secondary
                    >
                        Refresh
                    </Button>
                </header>

                <form className={styles.filters} onSubmit={applyFilters}>
                    <div className={styles.filterHeading}>
                        <h2>Filters</h2>
                        <span>Daily site engagement</span>
                    </div>
                    <label>
                        <span>From</span>
                        <input
                            name='from'
                            onChange={updateFilter}
                            required
                            type='date'
                            value={draftFilters.from}
                        />
                    </label>
                    <label>
                        <span>To</span>
                        <input
                            name='to'
                            onChange={updateFilter}
                            required
                            type='date'
                            value={draftFilters.to}
                        />
                    </label>
                    <label>
                        <span>Site surface</span>
                        <select name='surface' onChange={updateFilter} value={draftFilters.surface || ''}>
                            <option value=''>All surfaces</option>
                            {(filterOptions.data?.surfaces ?? []).map(surface => (
                                <option key={surface} value={surface}>
                                    {formatAnalyticsSurface(surface)}
                                </option>
                            ))}
                        </select>
                    </label>
                    <div className={styles.filterActions}>
                        <Button primary type='submit'>Apply</Button>
                        <Button onClick={resetFilters} secondary type='button'>Reset</Button>
                    </div>
                    {filterError && (
                        <p className={styles.filterError} role='alert'>{filterError}</p>
                    )}
                </form>

                {reportPending && (
                    <AnalyticsLoadingState message='Loading general analytics…' />
                )}
                {report.error && !data && <ReportError error={report.error} onRetry={report.refresh} />}
                {data && !reportPending && (
                    <>
                        <div className={styles.freshness} role='status'>
                            Data through
                            {' '}
                            <strong>{formatAnalyticsFreshness(data.dataThrough)}</strong>
                            {' · Daily processing'}
                        </div>
                        {report.error && (
                            <div className={styles.staleWarning}>{report.error.message}</div>
                        )}
                        <section aria-label='General analytics totals' className={styles.metricGrid}>
                            <MetricCard
                                label='Page views'
                                value={formatAnalyticsInteger(data.totals.pageViews)}
                            />
                            <MetricCard
                                label='Visitors'
                                tone='highlight'
                                value={formatAnalyticsInteger(data.totals.visitors)}
                            />
                            <MetricCard
                                label='Clicks'
                                tone='highlight'
                                value={formatAnalyticsInteger(data.totals.clicks)}
                            />
                            <MetricCard
                                label='People who clicked'
                                tone='success'
                                value={formatAnalyticsInteger(data.totals.clickers)}
                            />
                        </section>

                        <section className={styles.panel}>
                            <div className={styles.panelHeader}>
                                <div>
                                    <h2>Page views</h2>
                                    <p>{reportingPeriod}</p>
                                </div>
                            </div>
                            <TimeSeriesChart
                                ariaLabel='Daily page views'
                                points={data.series}
                                series={pageViewSeries}
                                variant='area'
                            />
                        </section>

                        <section className={styles.panel}>
                            <div className={styles.panelHeader}>
                                <div>
                                    <h2>Unique visitors</h2>
                                    <p>{reportingPeriod}</p>
                                </div>
                            </div>
                            <TimeSeriesChart
                                ariaLabel='Daily unique visitors'
                                points={data.series}
                                series={visitorSeries}
                                variant='area'
                            />
                        </section>

                        <section className={styles.panel}>
                            <div className={styles.panelHeader}>
                                <div>
                                    <h2>Clicks</h2>
                                    <p>{reportingPeriod}</p>
                                </div>
                            </div>
                            <TimeSeriesChart
                                ariaLabel='Daily clicks'
                                points={data.series}
                                series={clickSeries}
                                variant='area'
                            />
                        </section>

                        <section className={styles.panel}>
                            <div className={styles.panelHeader}>
                                <div>
                                    <h2>Most visited pages</h2>
                                    <p>Top query-free paths ranked by page views.</p>
                                </div>
                            </div>
                            <div className={styles.tableScroll}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th scope='col'>Surface</th>
                                            <th scope='col'>Page path</th>
                                            <th scope='col'>Page views</th>
                                            <th scope='col'>Visitors</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visibleVisitedPages.map(row => (
                                            <tr key={`${row.surface}-${row.path}`}>
                                                <td>{formatAnalyticsSurface(row.surface)}</td>
                                                <th scope='row'>{row.path}</th>
                                                <td>{formatAnalyticsInteger(row.pageViews)}</td>
                                                <td>{formatAnalyticsInteger(row.visitors)}</td>
                                            </tr>
                                        ))}
                                        {visibleVisitedPages.length === 0 && <EmptyTableRow columns={4} />}
                                    </tbody>
                                </table>
                            </div>
                            {visitedPagesTotal > 0 && (
                                <AnalyticsTablePagination
                                    onNext={showNextVisitedPages}
                                    onPrevious={showPreviousVisitedPages}
                                    page={activeVisitedPagesPage}
                                    pageSize={MOST_VISITED_PAGE_SIZE}
                                    total={visitedPagesTotal}
                                    totalPages={visitedPagesTotalPages}
                                />
                            )}
                        </section>

                        <section className={styles.panel}>
                            <div className={styles.panelHeader}>
                                <div>
                                    <h2>Traffic sources</h2>
                                    <p>Attributed source for viewed pages.</p>
                                </div>
                            </div>
                            <div className={styles.tableScroll}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th scope='col'>Source</th>
                                            <th scope='col'>Page views</th>
                                            <th scope='col'>Visitors</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.sources.map(row => (
                                            <tr key={row.source}>
                                                <th scope='row'>{row.source}</th>
                                                <td>{formatAnalyticsInteger(row.pageViews)}</td>
                                                <td>{formatAnalyticsInteger(row.visitors)}</td>
                                            </tr>
                                        ))}
                                        {data.sources.length === 0 && <EmptyTableRow columns={3} />}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </>
    )
}

export default GeneralAnalyticsPage
