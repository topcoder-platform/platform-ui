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
    LoadingSpinner,
    PageTitle,
} from '~/libs/ui'

import {
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

const generalSeries = [
    { color: '#2c95d7', key: 'pageViews', label: 'Page views' },
    { color: '#6f42c1', key: 'visitors', label: 'Visitors' },
    { color: '#137d60', key: 'clicks', label: 'Clicks' },
]

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

/**
 * Renders general site totals, engagement graph, and page/source/surface tables.
 *
 * @returns role-gated General Analytics page.
 * @throws Does not throw; request failures are rendered inline.
 */
export const GeneralAnalyticsPage: FC = () => {
    const initialFilters = useMemo(initialGeneralFilters, [])
    const [draftFilters, setDraftFilters] = useState<GeneralFilters>(initialFilters)
    const [appliedFilters, setAppliedFilters] = useState<GeneralFilters>(initialFilters)
    const [filterError, setFilterError] = useState<string>()
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
        if (!error) setAppliedFilters({ ...draftFilters })
    }, [draftFilters])
    const resetFilters = useCallback(() => {
        const next = initialGeneralFilters()
        setDraftFilters(next)
        setAppliedFilters(next)
        setFilterError(undefined)
    }, [])

    const data = report.data
    return (
        <>
            <PageTitle>General Analytics</PageTitle>
            {(report.loading || report.refreshing) && (
                <LoadingSpinner message='Loading general analytics…' overlay />
            )}
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

                {report.error && !data && <ReportError error={report.error} onRetry={report.refresh} />}
                {data && (
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
                                    <h2>Site engagement over time</h2>
                                    <p>Daily views, visitors, and interactions across the selected surface.</p>
                                </div>
                            </div>
                            <TimeSeriesChart
                                ariaLabel='Daily Topcoder site engagement'
                                points={data.series}
                                series={generalSeries}
                            />
                        </section>

                        <section className={styles.panel}>
                            <div className={styles.panelHeader}>
                                <div>
                                    <h2>Most visited pages</h2>
                                    <p>Query-free paths grouped by application surface.</p>
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
                                        {data.pages.map(row => (
                                            <tr key={`${row.surface}-${row.path}`}>
                                                <td>{formatAnalyticsSurface(row.surface)}</td>
                                                <th scope='row'>{row.path}</th>
                                                <td>{formatAnalyticsInteger(row.pageViews)}</td>
                                                <td>{formatAnalyticsInteger(row.visitors)}</td>
                                            </tr>
                                        ))}
                                        {data.pages.length === 0 && <EmptyTableRow columns={4} />}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className={styles.twoColumnGrid}>
                            <article className={styles.panel}>
                                <div className={styles.panelHeader}>
                                    <div>
                                        <h2>Traffic sources</h2>
                                        <p>First-touch source for viewed pages.</p>
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
                            </article>

                            <article className={styles.panel}>
                                <div className={styles.panelHeader}>
                                    <div>
                                        <h2>Application surfaces</h2>
                                        <p>Engagement split between instrumented Topcoder web applications.</p>
                                    </div>
                                </div>
                                <div className={styles.tableScroll}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th scope='col'>Surface</th>
                                                <th scope='col'>Views</th>
                                                <th scope='col'>Visitors</th>
                                                <th scope='col'>Clicks</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.surfaces.map(row => (
                                                <tr key={row.surface}>
                                                    <th scope='row'>{formatAnalyticsSurface(row.surface)}</th>
                                                    <td>{formatAnalyticsInteger(row.pageViews)}</td>
                                                    <td>{formatAnalyticsInteger(row.visitors)}</td>
                                                    <td>{formatAnalyticsInteger(row.clicks)}</td>
                                                </tr>
                                            ))}
                                            {data.surfaces.length === 0 && <EmptyTableRow columns={4} />}
                                        </tbody>
                                    </table>
                                </div>
                            </article>
                        </section>
                    </>
                )}
            </div>
        </>
    )
}

export default GeneralAnalyticsPage
