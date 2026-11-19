/* Native form handlers do not depend on callback identity. */
/* eslint-disable react/jsx-no-bind */
import { FC, useState } from 'react'

import { Button, PageTitle } from '~/libs/ui'

import { MetricCard, ReportError, TimeSeriesChart } from '../lib/components'
import { useAnalyticsResource } from '../lib/hooks'
import { SpaceTechFilters, SpaceTechGroup, SpaceTechReport } from '../lib/models'
import { getSpaceTechReport } from '../lib/services'
import { defaultAnalyticsDateRange, formatAnalyticsFreshness, validateAnalyticsDateRange } from '../lib/utils'

import { SpaceTechDashboard, spaceTechMetrics as metrics } from './SpaceTechDashboard'
import SpaceTechLeads from './SpaceTechLeads'
import styles from './AnalyticsPages.module.scss'

const campaignStart = '2026-11-05'
const series = [
    { color: '#2c5de5', key: 'visitors', label: 'Unique visitors' },
    { color: '#137d60', key: 'submissions', label: 'Form submissions' },
]
const dimensions = ['source', 'medium', 'campaign'] as const
const attributionKeys = new Set<string>(dimensions)
/** Public CMS question IDs keep reports readable without collecting rendered browser text. */
const labels: Record<string, string> = {
    'spacetech-faq-after': 'What happens after I submit?',
    'spacetech-faq-different': 'How is this different from hiring or a consulting engagement?',
    'spacetech-faq-safe': 'Is my data actually safe?',
    'spacetech-form': 'Closing section',
    'spacetech-hero': 'Hero',
}

/** Renders a small aggregate breakdown; empty dimensions remain explicitly unattributed. */
const Breakdown: FC<{ title: string; rows: SpaceTechGroup[]; columns: string[][] }> = props => (
    <section className={styles.panel}>
        <h2>{props.title}</h2>
        <div className={styles.tableScroll}>
            <table>
                <thead><tr>{props.columns.map(([key, label]) => <th key={key} scope='col'>{label}</th>)}</tr></thead>
                <tbody>
                    {props.rows.map((row, index) => (
                        // Aggregate row order is stable for a completed report.
                        // eslint-disable-next-line react/no-array-index-key
                        <tr key={index}>
                            {props.columns.map(([key]) => (
                                <td key={key}>
                                    {row[key] === ''
                                        ? (attributionKeys.has(key) ? 'Direct / unattributed' : 'Unknown')
                                        : (labels[row[key]] || row[key])}
                                </td>
                            ))}
                        </tr>
                    ))}
                    {!props.rows.length && (
                        <tr><td colSpan={props.columns.length}>No data matches these filters.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    </section>
)

/** SpaceTech opens on up to 90 UTC calendar days of campaign activity. */
function defaultSpaceTechFilters(): SpaceTechFilters {
    const to = defaultAnalyticsDateRange().to
    const start = new Date(`${to}T00:00:00Z`)
    start.setUTCDate(start.getUTCDate() - 89)
    const from = start.toISOString()
        .slice(0, 10)
    return { from: from < campaignStart ? campaignStart : from, to }
}

/** Shows UTM-attributed SpaceTech traffic, engagement, and accepted form submissions. */
export const SpaceTechAnalyticsPage: FC = () => {
    const [draft, setDraft] = useState(defaultSpaceTechFilters)
    const [tab, setTab] = useState<'dashboard' | 'details'>('dashboard')
    const [filters, setFilters] = useState(draft)
    const [leadRevision, setLeadRevision] = useState(0)
    const [error, setError] = useState<string>()
    const report = useAnalyticsResource<SpaceTechReport>(
        `spacetech:${JSON.stringify(filters)}`,
        () => getSpaceTechReport(filters),
    )
    function applyFilters(next: SpaceTechFilters): void {
        if (JSON.stringify(next) === JSON.stringify(filters)) report.refresh()
        setFilters(next)
        setLeadRevision(value => value + 1)
    }

    function clearFilters(): void {
        const defaults = defaultSpaceTechFilters()
        setDraft(defaults)
        setError(undefined)
        applyFilters(defaults)
    }

    return (
        <div className={styles.page}>
            <PageTitle>SpaceTech Analytics</PageTitle>
            <h1>SpaceTech</h1>
            <div aria-label='SpaceTech views' className={styles.reportTabs} role='tablist'>
                {(['dashboard', 'details'] as const).map(view => (
                    <button
                        key={view}
                        aria-controls={`spacetech-${view}`}
                        aria-selected={tab === view}
                        id={`spacetech-${view}-tab`}
                        onClick={() => setTab(view)}
                        onKeyDown={event => {
                            if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
                                event.preventDefault()
                                const next = event.key === 'Home' ? 'dashboard'
                                    : event.key === 'End' ? 'details'
                                        : view === 'dashboard' ? 'details' : 'dashboard'
                                setTab(next)
                                document.getElementById(`spacetech-${next}-tab`)
                                    ?.focus()
                            }
                        }}
                        role='tab'
                        tabIndex={tab === view ? 0 : -1}
                        type='button'
                    >
                        {view === 'dashboard' ? 'Dashboard' : 'Details'}
                    </button>
                ))}
            </div>
            <p>
                Traffic and accepted form submissions for /space-tech since November 5, 2026.
                Dates are inclusive and use UTC.
            </p>
            <form
                className={styles.filters}
                onSubmit={event => {
                    event.preventDefault()
                    const validation = validateAnalyticsDateRange(draft)
                        || (draft.from < campaignStart
                            ? 'Choose a start date on or after November 5, 2026.' : undefined)
                    setError(validation)
                    if (!validation) applyFilters(draft)
                }}
            >
                {(['from', 'to'] as const).map(key => (
                    <label key={key}>
                        {key === 'from' ? 'Start date' : 'End date'}
                        <input
                            min={campaignStart}
                            required
                            type='date'
                            value={draft[key]}
                            onChange={event => setDraft({ ...draft, [key]: event.target.value })}
                        />
                    </label>
                ))}
                {dimensions.map(key => (
                    <label className={key === 'campaign' ? styles.campaignFilter : undefined} key={key}>
                        {`utm_${key}`}
                        <select
                            value={draft[key] || ''}
                            onChange={event => setDraft({ ...draft, [key]: event.target.value })}
                        >
                            <option value=''>All</option>
                            {Array.from(new Set([...(report.data?.filterOptions?.[key] || []), draft[key] || '']))
                                .filter(Boolean)
                                .sort()
                                .map(value => <option key={value} value={value}>{value}</option>)}
                        </select>
                    </label>
                ))}
                <div className={styles.spaceTechFilterActions}>
                    <Button primary type='submit'>Apply filters</Button>
                    <Button secondary type='button' onClick={clearFilters}>Clear filters</Button>
                </div>
            </form>
            {error && <p role='alert'>{error}</p>}
            {report.error && <ReportError error={report.error} onRetry={report.refresh} />}
            {(report.loading || report.refreshing) && <p role='status'>Loading SpaceTech analytics…</p>}
            {report.data && (
                <>
                    <p>
                        Latest processed event (UTC):
                        {' '}
                        {report.data.dataThrough
                            ? formatAnalyticsFreshness(report.data.dataThrough)
                            : 'No processed SpaceTech events'}
                        . Aggregate data refreshes hourly. New activity normally appears within 3 hours.
                    </p>
                    <section
                        aria-labelledby={`spacetech-${tab}-tab`}
                        className={styles.reportContent}
                        id={`spacetech-${tab}`}
                        role='tabpanel'
                        tabIndex={0}
                    >
                        {tab === 'dashboard' ? <SpaceTechDashboard report={report.data} /> : (
                            <>
                                <div className={styles.metricGrid}>
                                    {metrics.map(([key, label]) => (
                                        <MetricCard key={key} label={label} value={report.data?.totals[key]} />
                                    ))}
                                </div>
                                <p>
                                    Submission rate is submissions ÷ unique visitors.
                                    Engagement counts foreground time only.
                                    Apply filters to fetch the latest report.
                                </p>
                                <p>
                                    Bars show daily visitors and submissions. Lines show seven-day moving averages.
                                </p>
                                <TimeSeriesChart
                                    ariaLabel='Daily SpaceTech visitors and submissions'
                                    points={report.data.series}
                                    series={series}
                                    variant='column-trend'
                                    xAxisTitle='Date (UTC)'
                                />
                                <Breakdown
                                    title='Campaign attribution'
                                    rows={report.data.campaigns}
                                    columns={[
                                        ...dimensions.map(key => [key, `utm_${key}`]),
                                        ['visitors', 'Visitors'], ['starts', 'Form starts'],
                                        ['submissions', 'Submissions'], ['submissionRate', 'Submission rate (%)'],
                                    ]}
                                />
                                <Breakdown
                                    title='CTA clicks'
                                    rows={report.data.ctas}
                                    columns={[
                                        ['placement', 'Section'], ['elementId', 'CTA'],
                                        ['events', 'Clicks'], ['users', 'Visitors'],
                                    ]}
                                />
                                <Breakdown
                                    title='FAQ questions opened'
                                    rows={report.data.faqs}
                                    columns={[
                                        ['faqId', 'Question'], ['events', 'Opens'], ['users', 'Visitors'],
                                    ]}
                                />
                                <Breakdown
                                    title='Country'
                                    rows={report.data.countries}
                                    columns={[
                                        ['country', 'Country'], ['visitors', 'Visitors'],
                                    ]}
                                />
                                <p>Country is unknown when collector location enrichment is unavailable.</p>
                                <Breakdown
                                    title='Device'
                                    rows={report.data.devices}
                                    columns={[
                                        ['device', 'Device category'], ['visitors', 'Visitors'],
                                    ]}
                                />
                                <SpaceTechLeads
                                    key={leadRevision}
                                    filters={filters}
                                    activity={report.data.formActivity}
                                />
                            </>
                        )}
                    </section>
                </>
            )}
        </div>
    )
}
