/** Detailed route-level analytics report rendered inside the General tab. */
import {
    FC,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'

import {
    AnalyticsLoadingState,
    MetricCard,
    ReportError,
} from '../lib/components'
import { AnalyticsResourceState } from '../lib/hooks'
import { RouteClickLocation, RouteReport } from '../lib/models'
import {
    formatAnalyticsDuration,
    formatAnalyticsFreshness,
    formatAnalyticsInteger,
    formatAnalyticsPercent,
} from '../lib/utils'

import styles from './AnalyticsPages.module.scss'

const ROUTE_CLICK_PAGE_SIZE = 20

const sourceLabels: Record<string, string> = {
    email: 'Email',
    organic: 'Organic',
    other: 'Other / direct',
    paid: 'Paid',
    social: 'Social',
}

/**
 * Combines optional host and path dimensions into one compact destination label.
 *
 * @param location aggregate semantic click location.
 * @returns destination label or an em dash when the item has no HTTP destination.
 * @throws Does not throw.
 */
function clickDestination(location: RouteClickLocation): string {
    return [location.destinationHost, location.destinationPath]
        .filter(Boolean)
        .join('') || '—'
}

/**
 * Builds a deterministic React key from the complete semantic click grouping.
 *
 * @param location aggregate semantic click location.
 * @returns delimiter-joined key used only for stable list rendering.
 * @throws Does not throw.
 */
function clickLocationKey(location: RouteClickLocation): string {
    return [
        location.placement,
        location.elementId,
        location.elementType,
        location.destinationHost,
        location.destinationPath,
    ].join('|')
}

interface RouteAnalyticsReportProps {
    path: string
    period: string
    resource: AnalyticsResourceState<RouteReport>
}

/**
 * Renders route KPIs, visitor classification, click locations, forms, and the challenge funnel.
 *
 * @param props selected path, reporting-period label, and asynchronous route resource state.
 * @returns detailed aggregate route report or its loading/error state.
 * @throws Does not throw; request failures are rendered inline.
 */
export const RouteAnalyticsReport: FC<RouteAnalyticsReportProps> = props => {
    const [clickPage, setClickPage] = useState(1)
    const data = props.resource.data
    const clickTotal = data?.clickLocations.length ?? 0
    const clickPages = Math.max(1, Math.ceil(clickTotal / ROUTE_CLICK_PAGE_SIZE))
    const activeClickPage = Math.min(clickPage, clickPages)
    const visibleClicks = useMemo(
        () => data?.clickLocations.slice(
            (activeClickPage - 1) * ROUTE_CLICK_PAGE_SIZE,
            activeClickPage * ROUTE_CLICK_PAGE_SIZE,
        ) ?? [],
        [activeClickPage, data?.clickLocations],
    )

    useEffect(() => {
        setClickPage(1)
    }, [props.path])
    /** Shows the prior local click-location page. */
    const showPreviousClicks = useCallback(() => {
        setClickPage(current => Math.max(1, current - 1))
    }, [])
    /** Shows the next local click-location page without exceeding the result set. */
    const showNextClicks = useCallback(() => {
        setClickPage(current => Math.min(clickPages, current + 1))
    }, [clickPages])

    return (
        <section aria-labelledby='route-report-title' className={styles.routeReport} id='route-analytics-details'>
            <div className={styles.routeReportHeading}>
                <div>
                    <p className={styles.eyebrow}>Route lookup</p>
                    <h2 id='route-report-title'>{props.path}</h2>
                    <p>{props.period}</p>
                </div>
                {data && (
                    <span>
                        Data through
                        {' '}
                        <strong>{formatAnalyticsFreshness(data.dataThrough)}</strong>
                    </span>
                )}
            </div>

            {(props.resource.loading || props.resource.refreshing) && (
                <AnalyticsLoadingState message={`Loading analytics for ${props.path}…`} />
            )}
            {props.resource.error && !data && (
                <ReportError error={props.resource.error} onRetry={props.resource.refresh} />
            )}
            {props.resource.error && data && (
                <div className={styles.staleWarning}>{props.resource.error.message}</div>
            )}

            {data && !props.resource.loading && !props.resource.refreshing && (
                <>
                    <section aria-label='Route engagement totals' className={styles.metricGrid}>
                        <MetricCard
                            label='Page views'
                            value={formatAnalyticsInteger(data.totals.pageViews)}
                        />
                        <MetricCard
                            label='Unique visitors'
                            tone='highlight'
                            value={formatAnalyticsInteger(data.totals.visitors)}
                        />
                        <MetricCard
                            context={`${formatAnalyticsPercent(data.totals.clickThroughPercent)} of visitors`}
                            label='People who clicked'
                            tone='highlight'
                            value={formatAnalyticsInteger(data.totals.clickers)}
                        />
                        <MetricCard
                            context={`${formatAnalyticsInteger(data.totals.clicks)} total clicks`}
                            label='Click-through rate'
                            tone='success'
                            value={formatAnalyticsPercent(data.totals.clickThroughPercent)}
                        />
                        <MetricCard
                            context='Focused foreground time per page view'
                            label='Average time on page'
                            value={formatAnalyticsDuration(data.totals.averageEngagementSeconds)}
                        />
                        <MetricCard
                            context={`${formatAnalyticsInteger(data.totals.bounces)} of ${formatAnalyticsInteger(
                                data.totals.entrances,
                            )} entrance sessions`}
                            label='Bounce rate'
                            value={formatAnalyticsPercent(data.totals.bounceRatePercent)}
                        />
                        <MetricCard
                            context={`${formatAnalyticsInteger(data.totals.conversions)} converted visitors`}
                            label='Conversion rate'
                            tone='success'
                            value={formatAnalyticsPercent(data.totals.conversionRatePercent)}
                        />
                        <MetricCard
                            context={`${formatAnalyticsInteger(
                                data.totals.formCompletions,
                            )} completed · ${formatAnalyticsInteger(
                                data.totals.formAbandonments,
                            )} abandoned`}
                            label='Form starts'
                            value={formatAnalyticsInteger(data.totals.formStarts)}
                        />
                    </section>

                    <section className={styles.twoColumnGrid}>
                        <article className={styles.panel}>
                            <div className={styles.panelHeader}>
                                <div>
                                    <h2>Visitors by source</h2>
                                    <p>Mutually exclusive source from each visitor’s first route view.</p>
                                </div>
                            </div>
                            <div className={styles.tableScroll}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th scope='col'>Source</th>
                                            <th scope='col'>Visitors</th>
                                            <th scope='col'>Share</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.visitorSources.map(row => (
                                            <tr key={row.source}>
                                                <th scope='row'>{sourceLabels[row.source] ?? row.source}</th>
                                                <td>{formatAnalyticsInteger(row.visitors)}</td>
                                                <td>{formatAnalyticsPercent(row.percent)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </article>

                        <article className={styles.panel}>
                            <div className={styles.panelHeader}>
                                <div>
                                    <h2>New versus returning</h2>
                                    <p>Based on the AWS Clickstream session number at first route view.</p>
                                </div>
                            </div>
                            <div className={styles.visitorTypeGrid}>
                                <div>
                                    <span>New</span>
                                    <strong>{formatAnalyticsInteger(data.totals.newVisitors)}</strong>
                                </div>
                                <div>
                                    <span>Returning</span>
                                    <strong>{formatAnalyticsInteger(data.totals.returningVisitors)}</strong>
                                </div>
                                {data.totals.unknownVisitorType > 0 && (
                                    <div>
                                        <span>Unknown</span>
                                        <strong>{formatAnalyticsInteger(data.totals.unknownVisitorType)}</strong>
                                    </div>
                                )}
                            </div>
                        </article>
                    </section>

                    <section className={styles.panel}>
                        <div className={styles.panelHeader}>
                            <div>
                                <h2>Where people clicked</h2>
                                <p>
                                    Semantic items ranked by clicks; CTR is unique item clickers divided by
                                    route visitors.
                                </p>
                            </div>
                        </div>
                        <div className={styles.tableScroll}>
                            <table>
                                <thead>
                                    <tr>
                                        <th scope='col'>Element</th>
                                        <th scope='col'>Placement</th>
                                        <th scope='col'>Destination</th>
                                        <th scope='col'>Clicks</th>
                                        <th scope='col'>People</th>
                                        <th scope='col'>CTR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleClicks.map(row => (
                                        <tr key={clickLocationKey(row)}>
                                            <th scope='row'>
                                                <span className={styles.primaryCell}>
                                                    {row.elementId || row.elementType || 'Unlabelled element'}
                                                </span>
                                                {row.elementId && row.elementType && (
                                                    <span className={styles.secondaryCell}>{row.elementType}</span>
                                                )}
                                            </th>
                                            <td>{row.placement || '—'}</td>
                                            <td className={styles.pathCell}>
                                                {clickDestination(row)}
                                            </td>
                                            <td>{formatAnalyticsInteger(row.clicks)}</td>
                                            <td>{formatAnalyticsInteger(row.clickers)}</td>
                                            <td>{formatAnalyticsPercent(row.clickThroughPercent)}</td>
                                        </tr>
                                    ))}
                                    {visibleClicks.length === 0 && (
                                        <tr>
                                            <td className={styles.emptyTable} colSpan={6}>
                                                No clicks match this route.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {clickTotal > ROUTE_CLICK_PAGE_SIZE && (
                            <div className={styles.pagination}>
                                <span>
                                    {`Showing ${(activeClickPage - 1) * ROUTE_CLICK_PAGE_SIZE + 1}–${Math.min(
                                        clickTotal,
                                        activeClickPage * ROUTE_CLICK_PAGE_SIZE,
                                    )} of ${clickTotal} clicked items`}
                                </span>
                                <nav aria-label='Route click locations pagination'>
                                    <button
                                        disabled={activeClickPage <= 1}
                                        onClick={showPreviousClicks}
                                        type='button'
                                    >
                                        Previous
                                    </button>
                                    <span>{`Page ${activeClickPage} of ${clickPages}`}</span>
                                    <button
                                        disabled={activeClickPage >= clickPages}
                                        onClick={showNextClicks}
                                        type='button'
                                    >
                                        Next
                                    </button>
                                </nav>
                            </div>
                        )}
                    </section>

                    <section className={styles.panel}>
                        <div className={styles.panelHeader}>
                            <div>
                                <h2>Forms</h2>
                                <p>
                                    Successful completions and the last field touched before an instrumented
                                    form was left.
                                </p>
                            </div>
                        </div>
                        {data.forms.length === 0 ? (
                            <p className={styles.emptyPanel}>
                                No instrumented form activity was recorded on this route in the selected
                                period.
                            </p>
                        ) : (
                            <div className={styles.tableScroll}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th scope='col'>Form</th>
                                            <th scope='col'>Views</th>
                                            <th scope='col'>Starts</th>
                                            <th scope='col'>Completed</th>
                                            <th scope='col'>Completion rate</th>
                                            <th scope='col'>Abandoned</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.forms.map(row => (
                                            <tr key={row.formId}>
                                                <th className={styles.pathCell} scope='row'>{row.formId}</th>
                                                <td>{formatAnalyticsInteger(row.views)}</td>
                                                <td>{formatAnalyticsInteger(row.starts)}</td>
                                                <td>{formatAnalyticsInteger(row.completions)}</td>
                                                <td>{formatAnalyticsPercent(row.completionRatePercent)}</td>
                                                <td>
                                                    {`${formatAnalyticsInteger(
                                                        row.abandonments,
                                                    )} (${formatAnalyticsPercent(
                                                        row.abandonmentRatePercent,
                                                    )})`}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {data.formAbandonments.length > 0 && (
                            <div className={styles.abandonmentSection}>
                                <h3>Where people abandoned forms</h3>
                                <div className={styles.tableScroll}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th scope='col'>Form / last field</th>
                                                <th scope='col'>Abandonments</th>
                                                <th scope='col'>People</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.formAbandonments
                                                .slice(0, 20)
                                                .map(row => (
                                                    <tr key={`${row.formId}|${row.fieldId}`}>
                                                        <th scope='row'>
                                                            <span className={styles.primaryCell}>{row.formId}</span>
                                                            <span className={styles.secondaryCell}>{row.fieldId}</span>
                                                        </th>
                                                        <td>{formatAnalyticsInteger(row.abandonments)}</td>
                                                        <td>{formatAnalyticsInteger(row.visitors)}</td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </section>

                    <section className={styles.panel}>
                        <div className={styles.panelHeader}>
                            <div>
                                <h2>Challenge funnel</h2>
                                <p>Ordered activity by the same visitor within the selected period.</p>
                            </div>
                        </div>
                        <div className={styles.funnelGrid}>
                            <MetricCard
                                label='Viewed page'
                                value={formatAnalyticsInteger(data.funnel.pageVisitors)}
                            />
                            <MetricCard
                                context={`${formatAnalyticsPercent(
                                    data.funnel.clickThroughPercent,
                                )} of viewers`}
                                label='Clicked challenge CTA'
                                tone='highlight'
                                value={formatAnalyticsInteger(data.funnel.challengeCtaClickers)}
                            />
                            <MetricCard
                                context={`${formatAnalyticsPercent(
                                    data.funnel.clickToRegistrationPercent,
                                )} of CTA clickers`}
                                label='Registered'
                                tone='highlight'
                                value={formatAnalyticsInteger(data.funnel.registrations)}
                            />
                            <MetricCard
                                context={`${formatAnalyticsPercent(
                                    data.funnel.registrationToSubmissionPercent,
                                )} of registrants`}
                                label='Submitted'
                                tone='success'
                                value={formatAnalyticsInteger(data.funnel.submissions)}
                            />
                            <MetricCard
                                context='No trusted winner event is available yet'
                                label='Won'
                                value={data.funnel.winTrackingAvailable && data.funnel.wins !== null
                                    ? formatAnalyticsInteger(data.funnel.wins)
                                    : 'Not tracked'}
                            />
                        </div>
                        <p className={styles.definitionNote}>
                            A challenge CTA is a tracked link from this route to a specific challenge URL.
                            Registration and submission must happen later for the same visitor. Form completion
                            or challenge registration counts as a conversion; each visitor is counted once.
                        </p>
                    </section>
                </>
            )}
        </section>
    )
}

export default RouteAnalyticsReport
