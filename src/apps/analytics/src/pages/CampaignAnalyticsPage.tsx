/** Campaign efficiency dashboard from landing page through challenge submission. */
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
    CampaignFilters,
    CampaignReport,
} from '../lib/models'
import {
    getAnalyticsFilters,
    getCampaignReport,
} from '../lib/services'
import {
    analyticsRequestKey,
    defaultAnalyticsDateRange,
    formatAnalyticsFreshness,
    formatAnalyticsInteger,
    formatAnalyticsPercent,
    validateAnalyticsDateRange,
} from '../lib/utils'

import styles from './AnalyticsPages.module.scss'

const CLICK_LOCATION_PAGE_SIZE = 20
const campaignSeries = [
    { color: '#2c95d7', key: 'landingUsers', label: 'Landing visitors' },
    { color: '#6f42c1', key: 'landingClickers', label: 'Clicked' },
    { color: '#f59e0b', key: 'registrations', label: 'Registered' },
    { color: '#137d60', key: 'submissions', label: 'Submitted' },
]

/**
 * Creates the complete default campaign filter state.
 *
 * @returns thirty-day range with no UTM restriction.
 * @throws Does not throw.
 */
function initialCampaignFilters(): CampaignFilters {
    return {
        ...defaultAnalyticsDateRange(),
        campaign: '',
        campaignId: '',
        medium: '',
        source: '',
    }
}

interface FilterSelectProps {
    label: string
    name: string
    onChange: (event: ChangeEvent<HTMLSelectElement>) => void
    options?: string[]
    value?: string
}

/**
 * Renders one server-populated optional campaign filter.
 *
 * @param props label, form name, options, value, and change callback.
 * @returns accessible select with an all-values option.
 * @throws Does not throw.
 */
const FilterSelect: FC<FilterSelectProps> = props => (
    <label>
        <span>{props.label}</span>
        <select name={props.name} onChange={props.onChange} value={props.value || ''}>
            <option value=''>All</option>
            {(props.options ?? []).map(option => (
                <option key={option} value={option}>{option}</option>
            ))}
        </select>
    </label>
)

/**
 * Renders a consistent empty message spanning an analytics table.
 *
 * @param props number of columns spanned by the message.
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
 * Renders campaign filters, funnel KPIs, daily graph, and safe breakdown tables.
 *
 * @returns role-gated Campaign Analytics page.
 * @throws Does not throw; request failures are rendered inline.
 */
export const CampaignAnalyticsPage: FC = () => {
    const initialFilters = useMemo(initialCampaignFilters, [])
    const [draftFilters, setDraftFilters] = useState<CampaignFilters>(initialFilters)
    const [appliedFilters, setAppliedFilters] = useState<CampaignFilters>(initialFilters)
    const [filterError, setFilterError] = useState<string>()
    const [clickLocationsPage, setClickLocationsPage] = useState(1)
    const filterOptions = useAnalyticsResource<AnalyticsFilterOptions>('analytics-filters', getAnalyticsFilters)
    const reportKey = analyticsRequestKey('campaign', appliedFilters)
    const report = useAnalyticsResource<CampaignReport>(
        reportKey,
        useCallback(() => getCampaignReport(appliedFilters), [appliedFilters]),
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
            setClickLocationsPage(1)
        }
    }, [draftFilters])

    const resetFilters = useCallback(() => {
        const next = initialCampaignFilters()
        setDraftFilters(next)
        setAppliedFilters(next)
        setClickLocationsPage(1)
        setFilterError(undefined)
    }, [])

    const data = report.data
    const reportPending = report.loading || report.refreshing
    const clickLocationsTotal = data?.clickLocations.length ?? 0
    const clickLocationsTotalPages = Math.max(
        1,
        Math.ceil(clickLocationsTotal / CLICK_LOCATION_PAGE_SIZE),
    )
    const activeClickLocationsPage = Math.min(clickLocationsPage, clickLocationsTotalPages)
    const visibleClickLocations = data?.clickLocations.slice(
        (activeClickLocationsPage - 1) * CLICK_LOCATION_PAGE_SIZE,
        activeClickLocationsPage * CLICK_LOCATION_PAGE_SIZE,
    ) ?? []
    const showPreviousClickLocations = useCallback(() => {
        setClickLocationsPage(current => Math.max(1, current - 1))
    }, [])
    const showNextClickLocations = useCallback(() => {
        setClickLocationsPage(current => Math.min(clickLocationsTotalPages, current + 1))
    }, [clickLocationsTotalPages])
    const firstVisibleClickLocation = clickLocationsTotal === 0
        ? 0
        : ((activeClickLocationsPage - 1) * CLICK_LOCATION_PAGE_SIZE) + 1
    const lastVisibleClickLocation = Math.min(
        clickLocationsTotal,
        activeClickLocationsPage * CLICK_LOCATION_PAGE_SIZE,
    )
    return (
        <>
            <PageTitle>Campaign Analytics</PageTitle>
            <div className={styles.page}>
                <header className={styles.pageHeader}>
                    <div>
                        <p className={styles.eyebrow}>Campaign efficiency</p>
                        <h1>Landing page to submission</h1>
                        <p>
                            Measure campaign engagement through click, registration,
                            and successful challenge submission.
                        </p>
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
                    <FilterSelect
                        label='Campaign'
                        name='campaign'
                        onChange={updateFilter}
                        options={filterOptions.data?.campaigns}
                        value={draftFilters.campaign}
                    />
                    <FilterSelect
                        label='Campaign ID (utm_id)'
                        name='campaignId'
                        onChange={updateFilter}
                        options={filterOptions.data?.campaignIds}
                        value={draftFilters.campaignId}
                    />
                    <FilterSelect
                        label='Source'
                        name='source'
                        onChange={updateFilter}
                        options={filterOptions.data?.sources}
                        value={draftFilters.source}
                    />
                    <FilterSelect
                        label='Medium'
                        name='medium'
                        onChange={updateFilter}
                        options={filterOptions.data?.mediums}
                        value={draftFilters.medium}
                    />
                    <div className={styles.filterActions}>
                        <Button primary type='submit'>Apply</Button>
                        <Button onClick={resetFilters} secondary type='button'>Reset</Button>
                    </div>
                    {filterError && (
                        <p className={styles.filterError} role='alert'>{filterError}</p>
                    )}
                </form>

                {reportPending && (
                    <AnalyticsLoadingState message='Loading campaign analytics…' />
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
                        <section aria-label='Campaign funnel totals' className={styles.metricGrid}>
                            <MetricCard
                                label='Landing visitors'
                                value={formatAnalyticsInteger(data.totals.landingUsers)}
                            />
                            <MetricCard
                                context={`${formatAnalyticsPercent(
                                    data.totals.clickThroughPercent,
                                )} of landing visitors`}
                                label='People who clicked'
                                tone='highlight'
                                value={formatAnalyticsInteger(data.totals.landingClickers)}
                            />
                            <MetricCard
                                context={`${formatAnalyticsPercent(
                                    data.totals.clickToRegistrationPercent,
                                )} of clickers`}
                                label='Registered'
                                tone='highlight'
                                value={formatAnalyticsInteger(data.totals.registrations)}
                            />
                            <MetricCard
                                context={`${formatAnalyticsPercent(
                                    data.totals.registrationToSubmissionPercent,
                                )} of registrants`}
                                label='Submitted'
                                tone='success'
                                value={formatAnalyticsInteger(data.totals.submissions)}
                            />
                        </section>

                        <section className={styles.panel}>
                            <div className={styles.panelHeader}>
                                <div>
                                    <h2>Engagement over time</h2>
                                    <p>Daily cohorts for each ordered funnel stage.</p>
                                </div>
                                <strong>
                                    {`${formatAnalyticsPercent(
                                        data.totals.landingToSubmissionPercent,
                                    )} overall conversion`}
                                </strong>
                            </div>
                            <TimeSeriesChart
                                ariaLabel='Daily campaign funnel engagement'
                                points={data.series}
                                series={campaignSeries}
                            />
                        </section>

                        <section className={styles.panel}>
                            <div className={styles.panelHeader}>
                                <div>
                                    <h2>Campaign performance</h2>
                                    <p>Attribution grouped by campaign, source, medium, and UTM ID.</p>
                                </div>
                            </div>
                            <div className={styles.tableScroll}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th scope='col'>Campaign</th>
                                            <th scope='col'>UTM ID</th>
                                            <th scope='col'>Source / medium</th>
                                            <th scope='col'>Landing</th>
                                            <th scope='col'>Clicked</th>
                                            <th scope='col'>Registered</th>
                                            <th scope='col'>Submitted</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.campaigns.map(row => (
                                            <tr
                                                key={[
                                                    row.campaign,
                                                    row.campaignId,
                                                    row.source,
                                                    row.medium,
                                                ].join('|')}
                                            >
                                                <th scope='row'>{row.campaign}</th>
                                                <td>{row.campaignId || '—'}</td>
                                                <td>{`${row.source} / ${row.medium}`}</td>
                                                <td>{formatAnalyticsInteger(row.landingUsers)}</td>
                                                <td>{formatAnalyticsInteger(row.landingClickers)}</td>
                                                <td>{formatAnalyticsInteger(row.registrations)}</td>
                                                <td>{formatAnalyticsInteger(row.submissions)}</td>
                                            </tr>
                                        ))}
                                        {data.campaigns.length === 0 && <EmptyTableRow columns={7} />}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className={styles.twoColumnGrid}>
                            <article className={styles.panel}>
                                <div className={styles.panelHeader}>
                                    <div>
                                        <h2>Landing pages</h2>
                                        <p>Entry pages contributing to the selected funnel.</p>
                                    </div>
                                </div>
                                <div className={styles.tableScroll}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th scope='col'>Path</th>
                                                <th scope='col'>Visitors</th>
                                                <th scope='col'>Submitted</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.landingPages.map(row => (
                                                <tr key={row.path}>
                                                    <th scope='row'>{row.path}</th>
                                                    <td>{formatAnalyticsInteger(row.landingUsers)}</td>
                                                    <td>{formatAnalyticsInteger(row.submissions)}</td>
                                                </tr>
                                            ))}
                                            {data.landingPages.length === 0 && <EmptyTableRow columns={3} />}
                                        </tbody>
                                    </table>
                                </div>
                            </article>

                            <article className={styles.panel}>
                                <div className={styles.panelHeader}>
                                    <div>
                                        <h2>Where people clicked</h2>
                                        <p>Top clicked elements ranked by total clicks.</p>
                                    </div>
                                </div>
                                <div className={styles.tableScroll}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th scope='col'>Page / element</th>
                                                <th scope='col'>Clicks</th>
                                                <th scope='col'>People</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {visibleClickLocations.map(row => (
                                                <tr
                                                    key={[
                                                        row.pagePath,
                                                        row.placement,
                                                        row.elementId,
                                                        row.elementType,
                                                        row.destinationHost,
                                                        row.destinationPath,
                                                    ].join('|')}
                                                >
                                                    <th scope='row'>
                                                        <span className={styles.primaryCell}>{row.pagePath}</span>
                                                        <span className={styles.secondaryCell}>
                                                            {[row.placement, row.elementId || row.elementType]
                                                                .filter(Boolean)
                                                                .join(' · ') || 'Unlabelled interactive element'}
                                                        </span>
                                                    </th>
                                                    <td>{formatAnalyticsInteger(row.clicks)}</td>
                                                    <td>{formatAnalyticsInteger(row.clickers)}</td>
                                                </tr>
                                            ))}
                                            {visibleClickLocations.length === 0 && <EmptyTableRow columns={3} />}
                                        </tbody>
                                    </table>
                                </div>
                                {clickLocationsTotal > 0 && (
                                    <div className={styles.pagination}>
                                        <span>
                                            {`Showing ${firstVisibleClickLocation}–${lastVisibleClickLocation}`
                                                + ` of ${clickLocationsTotal} clicked items`}
                                        </span>
                                        <nav aria-label='Click locations pagination'>
                                            <button
                                                disabled={activeClickLocationsPage <= 1}
                                                onClick={showPreviousClickLocations}
                                                type='button'
                                            >
                                                Previous
                                            </button>
                                            <span>
                                                {`Page ${activeClickLocationsPage}`
                                                    + ` of ${clickLocationsTotalPages}`}
                                            </span>
                                            <button
                                                disabled={activeClickLocationsPage >= clickLocationsTotalPages}
                                                onClick={showNextClickLocations}
                                                type='button'
                                            >
                                                Next
                                            </button>
                                        </nav>
                                    </div>
                                )}
                            </article>
                        </section>
                    </>
                )}
            </div>
        </>
    )
}

export default CampaignAnalyticsPage
