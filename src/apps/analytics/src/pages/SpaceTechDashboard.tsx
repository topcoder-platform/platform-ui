/* Native select handlers do not depend on callback identity. */
/* eslint-disable react/jsx-no-bind */
import { FC, useState } from 'react'

import { TimeSeriesChart } from '../lib/components'
import { SpaceTechMetrics, SpaceTechReport } from '../lib/models'
import { formatAnalyticsInteger, formatAnalyticsPercent } from '../lib/utils'

import styles from './AnalyticsPages.module.scss'

export const spaceTechMetrics = [
    ['pageViews', 'Page views'], ['visitors', 'Unique visitors'], ['starts', 'Form starts'],
    ['submissions', 'Submissions'], ['submissionRate', 'Submission rate (%)'],
    ['reached', 'Visitors reaching form'], ['averageEngagementSeconds', 'Engaged seconds / page view'],
] as const

const personas = [
    { color: '#137d60', key: 'topcoder', label: 'Topcoder' },
    { color: '#2c5de5', key: 'george', label: 'George' },
    { color: '#8b46bd', key: 'anita', label: 'Anita' },
    { color: '#bd6213', key: 'tony', label: 'Tony' },
] as const

/** Preserve decimal precision for rates and seconds, including percentages over 100. */
function formatMetric(key: keyof SpaceTechMetrics, value: number): string {
    if (key === 'submissionRate') return formatAnalyticsPercent(value)
    if (key === 'averageEngagementSeconds') return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
    return formatAnalyticsInteger(value)
}

/** Compare campaign personas using daily activity and independently aggregated period totals. */
export const SpaceTechDashboard: FC<{ report: SpaceTechReport }> = props => {
    const report = props.report
    const [metric, setMetric] = useState<keyof SpaceTechMetrics>('pageViews')
    const label = spaceTechMetrics.find(([key]) => key === metric)?.[1] ?? 'Page views'
    const decimalMetric = metric === 'submissionRate' || metric === 'averageEngagementSeconds'
    const points = report.dailyPersonaSeries?.map(day => ({
        date: day.date,
        ...Object.fromEntries(personas.map(persona => [persona.key, day[persona.key][metric]])),
    })) ?? []

    if (!report.personas) {
        return <p role='status'>Source dashboard data is unavailable. Apply filters to retry or view Details.</p>
    }

    return (
        <>
            <section className={styles.panel}>
                <div className={styles.panelHeader}>
                    <div>
                        <h2>Performance over time</h2>
                        <p>Bars show daily values. Each line shows the seven-day moving average for its source.</p>
                    </div>
                    <label className={styles.metricSelect}>
                        <span>Metric</span>
                        <select
                            value={metric}
                            onChange={event => setMetric(event.target.value as keyof SpaceTechMetrics)}
                        >
                            {spaceTechMetrics.map(([key, title]) => <option key={key} value={key}>{title}</option>)}
                        </select>
                    </label>
                </div>
                {report.dailyPersonaSeries ? (
                    <TimeSeriesChart
                        ariaLabel={`Daily SpaceTech ${label.toLowerCase()} by source`}
                        points={points}
                        series={[...personas]}
                        variant='column-trend'
                        valueDecimals={decimalMetric ? 2 : 0}
                        valueSuffix={metric === 'submissionRate' ? '%' : ''}
                        xAxisTitle='Date (UTC)'
                        yAxisTitle={label}
                    />
                ) : <p role='status'>Daily source data is unavailable. Apply filters to retry.</p>}
            </section>
            <section className={styles.panel}>
                <div className={styles.panelHeader}>
                    <div>
                        <h2>Source performance</h2>
                        <p>Totals for the selected period and filters.</p>
                    </div>
                </div>
                <div className={styles.tableScroll}>
                    <table aria-label='SpaceTech source performance'>
                        <thead>
                            <tr>
                                <th scope='col'>Source</th>
                                {spaceTechMetrics.map(([key, title]) => <th key={key} scope='col'>{title}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {personas.map(persona => {
                                const row = report.personas?.find(value => value.persona === persona.key)
                                return (
                                    <tr key={persona.key}>
                                        <th scope='row'>{persona.label}</th>
                                        {spaceTechMetrics.map(([key]) => (
                                            <td key={key}>{row ? formatMetric(key, row[key]) : '—'}</td>
                                        ))}
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                <p className={styles.definitionNote}>
                    Source comes only from the persona in utm_campaign
                    {' '}
                    (customer_spacetech_[period]_[persona]_…). Other campaigns and unattributed traffic
                    remain in Details. Visitors are distinct within each source and period and may appear
                    under multiple sources. Submission rate is submissions ÷ unique visitors; engaged
                    seconds per page view counts foreground time only.
                </p>
            </section>
        </>
    )
}
