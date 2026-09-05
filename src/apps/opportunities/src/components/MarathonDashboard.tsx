/* eslint-disable react/no-this-in-sfc, react/jsx-no-bind */
import { FC, useMemo } from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import useSWR, { SWRResponse } from 'swr'

import {
    ChallengeOpportunity,
    ChallengeReviewSummation,
} from '../models'
import { getChallengeReviewSummations } from '../services'
import {
    buildMarathonDashboardData,
    formatMarathonScore,
    marathonRatingColor,
} from '../utils/marathon-match.utils'

import { OpportunityTabLoading } from './OpportunityTabLoading'
import styles from './MarathonDashboard.module.scss'

interface MarathonDashboardProps {
    challenge: ChallengeOpportunity
}

/**
 * Reads one finite numeric value from Challenge API metadata.
 *
 * @param challenge Marathon Match detail record.
 * @param name case-insensitive metadata key.
 * @returns finite metadata number, or undefined.
 * @throws Does not throw.
 */
function numericMetadata(challenge: ChallengeOpportunity, name: string): number | undefined {
    const normalizedName = name.replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase()
    const value = challenge.metadata?.find(item => item.name.replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase() === normalizedName)
        ?.value
    if (value === null || value === undefined || value === '') return undefined
    const numberValue = Number(value)
    return Number.isFinite(numberValue) ? numberValue : undefined
}

/**
 * Restores the Marathon Match score-over-time dashboard from community-app on
 * the Opportunities challenge route.
 *
 * @param props Marathon Match challenge used to load summations and chart thresholds.
 * @returns accessible chart, loading/error state, or empty-score state.
 * @throws Does not throw; request failures render a retryable in-page state.
 */
export const MarathonDashboard: FC<MarathonDashboardProps> = props => {
    const response: SWRResponse<ChallengeReviewSummation[], Error> = useSWR(
        ['opportunities:mm-review-summations', props.challenge.id],
        () => getChallengeReviewSummations(props.challenge.id),
        { revalidateOnFocus: false, shouldRetryOnError: false },
    )
    const dashboard = useMemo(
        () => buildMarathonDashboardData(response.data ?? []),
        [response.data],
    )
    const points = dashboard.flatMap(member => member.submissions.map(submission => ({
        color: marathonRatingColor(member.rating),
        custom: {
            submissionCount: member.submissions.length,
            submissionId: submission.submissionId,
            submissionLabel: `${member.submissions.length} submission${member.submissions.length === 1 ? '' : 's'}`,
        },
        name: member.handle,
        x: Date.parse(submission.createdAt),
        y: submission.score,
    })))
        .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y))
    const baseline = numericMetadata(props.challenge, 'baseline')
    const awardLine = numericMetadata(props.challenge, 'awardLine')
    const options = useMemo<Highcharts.Options>(() => ({
        accessibility: { enabled: false },
        chart: {
            animation: false,
            backgroundColor: '#ffffff',
            height: 340,
            type: 'scatter',
        },
        credits: { enabled: false },
        exporting: { enabled: false },
        legend: { enabled: false },
        plotOptions: {
            scatter: {
                marker: {
                    radius: 5,
                    symbol: 'circle',
                },
            },
            series: {
                animation: false,
            },
        },
        series: [{
            data: points,
            name: 'Submissions',
            type: 'scatter',
        }],
        title: { text: undefined },
        tooltip: {
            backgroundColor: '#001e2e',
            borderColor: '#001e2e',
            borderRadius: 8,
            headerFormat: '',
            pointFormat: '<b>{point.name}</b><br/>'
                + '{point.custom.submissionLabel}<br/>'
                + 'Score: <b>{point.y:,.2f}</b><br/>'
                + 'Submitted {point.x:%e %b, %Y}<br/>',
            style: {
                color: '#fff',
                fontSize: '12px',
                lineHeight: '16px',
            },
        },
        xAxis: {
            gridLineColor: '#e8e8e8',
            gridLineWidth: 1,
            labels: {
                format: '{value:%m/%d}',
                style: { color: '#525252', fontSize: '12px' },
            },
            lineColor: '#a8a8a8',
            title: { text: undefined },
            type: 'datetime',
        },
        yAxis: {
            gridLineColor: '#e8e8e8',
            labels: { style: { color: '#525252', fontSize: '12px' } },
            max: 100,
            min: 0,
            plotLines: [
                ...(awardLine !== undefined ? [{
                    color: 'rgba(19, 125, 96, 0.7)',
                    label: { text: 'Award' },
                    value: awardLine,
                    width: 2,
                }] : []),
                ...(baseline !== undefined ? [{
                    color: 'rgba(82, 82, 82, 0.7)',
                    label: { text: 'Baseline' },
                    value: baseline,
                    width: 2,
                }] : []),
            ],
            title: { text: 'Score' },
        },
    }), [awardLine, baseline, points])

    if (response.isValidating && !response.data) {
        return <OpportunityTabLoading label='Loading Marathon Match dashboard' />
    }

    if (response.error) {
        return (
            <div className={styles.message} role='alert'>
                <h2>Dashboard unavailable</h2>
                <p>The Marathon Match scores could not be loaded.</p>
                <button onClick={() => response.mutate()} type='button'>Try again</button>
            </div>
        )
    }

    if (!points.length) {
        return (
            <div className={styles.message} role='status'>
                <h2>No dashboard scores yet</h2>
                <p>Successful provisional or final scoring results will appear here.</p>
            </div>
        )
    }

    return (
        <section className={styles.dashboard}>
            <div className={styles.chart}>
                <h3>Challenge Activity</h3>
                <HighchartsReact highcharts={Highcharts} options={options} />
            </div>
            <table className={styles.screenReaderOnly}>
                <caption>Marathon Match submission scores over time</caption>
                <thead>
                    <tr>
                        <th>Handle</th>
                        <th>Submission Date</th>
                        <th>Score</th>
                    </tr>
                </thead>
                <tbody>
                    {dashboard.flatMap(member => member.submissions.map(submission => (
                        <tr key={`${member.handle}-${submission.submissionId}`}>
                            <td>{member.handle}</td>
                            <td>{submission.createdAt}</td>
                            <td>{formatMarathonScore(submission.score, '-')}</td>
                        </tr>
                    )))}
                </tbody>
            </table>
        </section>
    )
}
