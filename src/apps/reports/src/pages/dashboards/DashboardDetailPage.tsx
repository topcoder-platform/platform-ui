import {
    ComponentType,
    FC,
    SVGProps,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import {
    Link,
    Navigate,
    useParams,
} from 'react-router-dom'

import {
    Button,
    IconOutline,
    LoadingSpinner,
    PageTitle,
} from '~/libs/ui'

import {
    buildReportsPath,
    dashboardsPageRouteId,
} from '../../config/routes.config'
import {
    DashboardSlug,
    downloadBlobFile,
    downloadDashboardCsv,
    fetchDashboard,
} from '../../lib/services'
import { handleError } from '../../lib/utils'

import { DashboardChart } from './DashboardChart'
import {
    dashboardDefinitions,
    DashboardResponse,
    isDashboardSlug,
} from './dashboard.config'
import {
    buildDashboardCsvFileName,
    formatDashboardMonth,
    formatDashboardRangeLabel,
    formatPercentage,
    getDashboardRange,
} from './dashboard.utils'
import styles from './Dashboards.module.scss'

type DashboardMetric = {
    icon: ComponentType<SVGProps<SVGSVGElement>>
    label: string
    meta: string
    tone: 'blue' | 'green' | 'orange' | 'purple' | 'slate'
    value: string
}

type DashboardDetailContentProps = {
    dashboard: DashboardSlug
}

/**
 * Formats an all-time metric as a locale-aware integer.
 *
 * @param value Numeric summary value from the reports API.
 * @returns Number with thousands separators.
 * @throws Does not throw.
 */
function formatMetricInteger(value: number): string {
    return Math.max(0, Number(value) || 0)
        .toLocaleString('en-US')
}

/**
 * Formats an optional peak-month value for a summary metric.
 *
 * @param value API month key, or null when no historical data is available.
 * @returns Formatted month label or an em dash for an empty dataset.
 * @throws Does not throw.
 */
function formatPeakMonth(value: string | null): string {
    return value ? formatDashboardMonth(value) : '—'
}

/**
 * Builds the dashboard-specific metric cards shown beside the enlarged chart.
 *
 * @param response Selected dashboard response.
 * @returns Label, value, metadata, icon, and color for each relevant metric.
 * @throws Does not throw.
 */
function buildDashboardMetrics(response: DashboardResponse): DashboardMetric[] {
    switch (response.dashboard) {
        case 'members-paid':
            return [
                {
                    icon: IconOutline.UsersIcon,
                    label: 'Unique Members Paid',
                    meta: 'All time',
                    tone: 'blue',
                    value: formatMetricInteger(response.summary.totalUniqueMembers),
                },
                {
                    icon: IconOutline.CollectionIcon,
                    label: 'TaaS Members',
                    meta: 'All time',
                    tone: 'green',
                    value: formatMetricInteger(response.summary.taasUniqueMembers),
                },
                {
                    icon: IconOutline.BriefcaseIcon,
                    label: 'Task Members',
                    meta: 'All time',
                    tone: 'slate',
                    value: formatMetricInteger(response.summary.taskUniqueMembers),
                },
                {
                    icon: IconOutline.GiftIcon,
                    label: 'Contest Members',
                    meta: 'All time',
                    tone: 'purple',
                    value: formatMetricInteger(response.summary.contestUniqueMembers),
                },
                {
                    icon: IconOutline.CashIcon,
                    label: 'Engagement Members',
                    meta: 'All time',
                    tone: 'orange',
                    value: formatMetricInteger(response.summary.engagementUniqueMembers),
                },
                {
                    icon: IconOutline.TrendingUpIcon,
                    label: 'Peak Month',
                    meta: `${formatMetricInteger(response.summary.peakMonthUniqueMembers)} unique members`,
                    tone: 'purple',
                    value: formatPeakMonth(response.summary.peakMonth),
                },
            ]
        case 'challenge-participation':
            return [
                {
                    icon: IconOutline.UserGroupIcon,
                    label: 'Unique Registrants',
                    meta: 'All time',
                    tone: 'blue',
                    value: formatMetricInteger(response.summary.totalUniqueRegistrants),
                },
                {
                    icon: IconOutline.UploadIcon,
                    label: 'Unique Submitters',
                    meta: 'All time',
                    tone: 'green',
                    value: formatMetricInteger(response.summary.totalUniqueSubmitters),
                },
                {
                    icon: IconOutline.ChartBarIcon,
                    label: 'Submission Rate',
                    meta: 'All-time submitters per registrant',
                    tone: 'orange',
                    value: formatPercentage(response.summary.submissionRate),
                },
                {
                    icon: IconOutline.TrendingUpIcon,
                    label: 'Peak Registration Month',
                    meta: `${formatMetricInteger(response.summary.peakMonthRegistrants)} registrants`,
                    tone: 'purple',
                    value: formatPeakMonth(response.summary.peakMonth),
                },
            ]
        case 'new-signups':
        default:
            return [
                {
                    icon: IconOutline.UsersIcon,
                    label: 'Total Signups',
                    meta: 'All time',
                    tone: 'blue',
                    value: formatMetricInteger(response.summary.totalSignups),
                },
                {
                    icon: IconOutline.CheckCircleIcon,
                    label: 'Activated Members',
                    meta: `${formatPercentage(response.summary.activationRate)} · All time`,
                    tone: 'green',
                    value: formatMetricInteger(response.summary.activatedMembers),
                },
                {
                    icon: IconOutline.UserIcon,
                    label: 'Not Activated Members',
                    meta: `${formatPercentage(100 - response.summary.activationRate)} · All time`,
                    tone: 'slate',
                    value: formatMetricInteger(response.summary.notActivatedMembers),
                },
                {
                    icon: IconOutline.TrendingUpIcon,
                    label: 'Peak Month',
                    meta: `${formatMetricInteger(response.summary.peakMonthSignups)} signups`,
                    tone: 'purple',
                    value: formatPeakMonth(response.summary.peakMonth),
                },
            ]
    }
}

/**
 * Loads and renders one dashboard with period navigation, metrics, and CSV export.
 *
 * @param props Validated dashboard route slug.
 * @returns Detailed dashboard content.
 * @throws Does not throw. Request errors are rendered inline and sent to the reports toast handler.
 */
const DashboardDetailContent: FC<DashboardDetailContentProps> = props => {
    const definition = dashboardDefinitions[props.dashboard]
    const [periodOffset, setPeriodOffset] = useState<number>(0)
    const rangeReferenceDate = useMemo(() => new Date(), [])
    const range = useMemo(
        () => getDashboardRange(periodOffset, rangeReferenceDate),
        [periodOffset, rangeReferenceDate],
    )
    const [response, setResponse] = useState<DashboardResponse>()
    const [errorMessage, setErrorMessage] = useState<string>()
    const [isDownloading, setIsDownloading] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [refreshKey, setRefreshKey] = useState<number>(0)

    useEffect(() => {
        let isActive = true

        setErrorMessage(undefined)
        setResponse(undefined)
        setIsLoading(true)
        fetchDashboard(props.dashboard, range)
            .then(data => {
                if (isActive) {
                    setResponse(data)
                }
            })
            .catch(error => {
                if (isActive) {
                    setErrorMessage(
                        error instanceof Error && error.message
                            ? error.message
                            : 'Dashboard data could not be loaded. Please try again.',
                    )
                    handleError(error)
                }
            })
            .finally(() => {
                if (isActive) {
                    setIsLoading(false)
                }
            })

        return () => {
            isActive = false
        }
    }, [props.dashboard, range, refreshKey])

    const handlePreviousPeriod = useCallback(() => {
        setPeriodOffset(current => current - 1)
    }, [])

    const handleNextPeriod = useCallback(() => {
        setPeriodOffset(current => Math.min(current + 1, 0))
    }, [])

    const handleRetry = useCallback(() => {
        setRefreshKey(current => current + 1)
    }, [])

    const handleDownload = useCallback(async (): Promise<void> => {
        try {
            setIsDownloading(true)
            const blob = await downloadDashboardCsv(props.dashboard, range)
            downloadBlobFile(
                blob,
                buildDashboardCsvFileName(props.dashboard, range),
            )
        } catch (error) {
            handleError(error)
        } finally {
            setIsDownloading(false)
        }
    }, [props.dashboard, range])

    const metrics = response ? buildDashboardMetrics(response) : []

    return (
        <>
            <PageTitle>{definition.title}</PageTitle>
            {(isLoading || isDownloading) && (
                <LoadingSpinner
                    message={isDownloading ? 'Generating dashboard CSV…' : 'Loading dashboard…'}
                    overlay
                />
            )}

            <div className={styles.page}>
                <Link
                    className={styles.backLink}
                    to={buildReportsPath(dashboardsPageRouteId)}
                >
                    <IconOutline.ArrowLeftIcon aria-hidden='true' />
                    Back to Dashboards
                </Link>

                <header className={styles.detailHeader}>
                    <div className={styles.detailHeading}>
                        <h1>{definition.title}</h1>
                        <p>{definition.subtitle}</p>
                    </div>

                    <div className={styles.periodControls}>
                        <Button
                            icon={IconOutline.ChevronLeftIcon}
                            iconToLeft
                            onClick={handlePreviousPeriod}
                            secondary
                        >
                            Previous 6 Months
                        </Button>

                        <div className={styles.periodIndicator}>
                            <div>
                                <strong>{formatDashboardRangeLabel(range)}</strong>
                                <span>
                                    {periodOffset === 0
                                        ? 'Showing latest 6 months'
                                        : 'Showing previous 6-month period'}
                                </span>
                            </div>
                            <IconOutline.CalendarIcon aria-hidden='true' />
                        </div>

                        <Button
                            disabled={periodOffset === 0}
                            icon={IconOutline.ChevronRightIcon}
                            onClick={handleNextPeriod}
                            secondary
                        >
                            Next 6 Months
                        </Button>

                        <Button
                            disabled={isDownloading || isLoading || !response}
                            icon={IconOutline.DownloadIcon}
                            iconToLeft
                            onClick={handleDownload}
                            primary
                        >
                            Download CSV
                        </Button>
                    </div>
                </header>

                {errorMessage && !response && (
                    <section className={styles.errorState} role='alert'>
                        <IconOutline.ExclamationCircleIcon aria-hidden='true' />
                        <div>
                            <h2>Unable to load this dashboard</h2>
                            <p>{errorMessage}</p>
                            <Button onClick={handleRetry} secondary>
                                Try again
                            </Button>
                        </div>
                    </section>
                )}

                {response && (
                    <>
                        <section className={styles.detailGrid}>
                            <div className={styles.detailChart}>
                                <DashboardChart
                                    dashboard={props.dashboard}
                                    months={response.months}
                                />
                            </div>

                            <aside
                                aria-label={`${definition.title} summary metrics`}
                                className={styles.metricsPanel}
                            >
                                {metrics.map(metric => {
                                    const MetricIcon = metric.icon

                                    return (
                                        <div className={styles.metricRow} key={metric.label}>
                                            <span
                                                className={styles.metricIcon}
                                                data-tone={metric.tone}
                                            >
                                                <MetricIcon aria-hidden='true' />
                                            </span>
                                            <span className={styles.metricContent}>
                                                <span>{metric.label}</span>
                                                <strong>{metric.value}</strong>
                                                <small>{metric.meta}</small>
                                            </span>
                                        </div>
                                    )
                                })}
                            </aside>
                        </section>

                        <div className={styles.dataNote}>
                            <IconOutline.InformationCircleIcon aria-hidden='true' />
                            <span>Data is shown in UTC. Metrics are updated nightly.</span>
                        </div>
                    </>
                )}
            </div>
        </>
    )
}

/**
 * Validates the dashboard route parameter before mounting the detailed view.
 *
 * @returns Detailed dashboard or a redirect to the Dashboards landing page.
 * @throws Does not throw.
 */
export const DashboardDetailPage: FC = () => {
    const { dashboardSlug }: Readonly<Partial<{ dashboardSlug: string }>>
        = useParams<{ dashboardSlug: string }>()

    if (!isDashboardSlug(dashboardSlug)) {
        return (
            <Navigate
                replace
                to={buildReportsPath(dashboardsPageRouteId)}
            />
        )
    }

    return <DashboardDetailContent dashboard={dashboardSlug} />
}

export default DashboardDetailPage
