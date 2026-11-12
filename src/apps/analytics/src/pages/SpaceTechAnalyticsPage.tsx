/* Native form handlers do not depend on callback identity. */
/* eslint-disable react/jsx-no-bind */
import { FC, useState } from 'react'

import { PageTitle } from '~/libs/ui'

import { MetricCard, ReportError, TimeSeriesChart } from '../lib/components'
import { useAnalyticsResource } from '../lib/hooks'
import { SpaceTechFilters, SpaceTechGroup, SpaceTechReport } from '../lib/models'
import { getSpaceTechReport } from '../lib/services'
import { defaultAnalyticsDateRange, validateAnalyticsDateRange } from '../lib/utils'

import styles from './AnalyticsPages.module.scss'

const series = [
    { color: '#2c5de5', key: 'visitors', label: 'Unique visitors' },
    { color: '#137d60', key: 'submissions', label: 'Form submissions' },
]
const dimensions = ['source', 'medium', 'campaign', 'content'] as const
const metrics = [
    ['pageViews', 'Page views'], ['visitors', 'Unique visitors'], ['starts', 'Form starts'],
    ['submissions', 'Submissions'], ['submissionRate', 'Submission rate (%)'],
    ['reached', 'Visitors reaching form'], ['averageEngagementSeconds', 'Engaged seconds / page view'],
] as const

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
                                    {row[key] === '' ? 'Unknown / direct' : (labels[row[key]] || row[key])}
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

/** Shows UTM-attributed SpaceTech traffic, engagement, and accepted form submissions. */
export const SpaceTechAnalyticsPage: FC = () => {
    const [draft, setDraft] = useState<SpaceTechFilters>(() => {
        const range = defaultAnalyticsDateRange()
        const start = new Date(`${range.to}T00:00:00Z`)
        start.setUTCDate(start.getUTCDate() - 89)
        return { ...range,
            from: start.toISOString()
                .slice(0, 10) }
    })
    const [filters, setFilters] = useState(draft)
    const [error, setError] = useState<string>()
    const report = useAnalyticsResource<SpaceTechReport>(
        `spacetech:${JSON.stringify(filters)}`,
        () => getSpaceTechReport(filters),
    )
    return (
        <div className={styles.page}>
            <PageTitle>SpaceTech Analytics</PageTitle>
            <h1>SpaceTech</h1>
            <p>Traffic and accepted form submissions for /space-tech. Dates are inclusive and use UTC.</p>
            <form
                className={styles.filters}
                onSubmit={event => {
                    event.preventDefault()
                    const validation = validateAnalyticsDateRange(draft)
                    setError(validation)
                    if (!validation) setFilters({ ...draft })
                }}
            >
                {(['from', 'to'] as const).map(key => (
                    <label key={key}>
                        {key === 'from' ? 'Start date' : 'End date'}
                        <input
                            required
                            type='date'
                            value={draft[key]}
                            onChange={event => setDraft({ ...draft, [key]: event.target.value })}
                        />
                    </label>
                ))}
                {dimensions.map(key => (
                    <label key={key}>
                        {`utm_${key}`}
                        <input
                            maxLength={100}
                            value={draft[key] || ''}
                            onChange={event => setDraft({ ...draft, [key]: event.target.value })}
                        />
                    </label>
                ))}
                <button type='submit'>Apply filters</button>
            </form>
            {error && <p role='alert'>{error}</p>}
            {report.error && <ReportError error={report.error} onRetry={report.refresh} />}
            {(report.loading || report.refreshing) && <p role='status'>Loading SpaceTech analytics…</p>}
            {report.data && (
                <>
                    <p>{`Data through: ${report.data.dataThrough || 'No processed SpaceTech events'}`}</p>
                    <div className={styles.metricGrid}>
                        {metrics.map(([key, label]) => (
                            <MetricCard key={key} label={label} value={report.data?.totals[key]} />
                        ))}
                    </div>
                    <p>
                        Submission rate is submissions ÷ unique visitors. Engagement counts foreground time only.
                        Reports update daily.
                    </p>
                    <TimeSeriesChart
                        ariaLabel='Daily SpaceTech visitors and submissions'
                        points={report.data.series}
                        series={series}
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
                            ['placement', 'Section'], ['elementId', 'CTA'], ['events', 'Clicks'], ['users', 'Visitors'],
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
                    <p>
                        Lead names, work email, company, problem, submission date and UTM values are available
                        to authorized users in Reports → Forms → space_tech_challenge.
                    </p>
                </>
            )}
        </div>
    )
}
