import {
    ChangeEvent,
    ComponentType,
    FC,
    FormEvent,
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
    buildDashboardRangeFromMonths,
    DashboardRange,
    formatDashboardMonth,
    formatDashboardRangeLabel,
    formatPercentage,
    getDashboardRange,
    getDashboardRangeMonthCount,
    getDashboardRangeMonths,
    shiftDashboardRange,
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

type DashboardRangeMode = 'custom' | 'six-months'

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
 * Formats the selected dashboard period size for the date-range indicator.
 *
 * @param monthCount Positive number of calendar months in the applied range.
 * @returns A grammatically correct label such as `1 month selected`.
 * @throws Does not throw.
 */
function formatSelectedMonthCount(monthCount: number): string {
    return `${monthCount} ${monthCount === 1 ? 'month' : 'months'} selected`
}

/**
 * Builds a custom dashboard range that does not extend beyond available months.
 *
 * @param startMonth Inclusive custom start month in `YYYY-MM` format.
 * @param endMonth Inclusive custom end month in `YYYY-MM` format.
 * @param latestRange Latest available half-open UTC dashboard range.
 * @param latestEndMonth Latest available inclusive month in `YYYY-MM` format.
 * @returns Validated custom range ready for data and CSV requests.
 * @throws RangeError when the month selection is invalid or extends into the future.
 */
function buildAvailableDashboardRange(
    startMonth: string,
    endMonth: string,
    latestRange: DashboardRange,
    latestEndMonth: string,
): DashboardRange {
    const customRange = buildDashboardRangeFromMonths(startMonth, endMonth)

    if (customRange.endDate > latestRange.endDate) {
        throw new RangeError(
            `End month cannot be later than ${
                formatDashboardMonth(`${latestEndMonth}-01`)
            }.`,
        )
    }

    return customRange
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
                    label: 'Challenge Members',
                    meta: 'All time',
                    tone: 'purple',
                    value: formatMetricInteger(response.summary.challengeUniqueMembers),
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
    const rangeReferenceDate = useMemo(() => new Date(), [])
    const latestRange = useMemo(
        () => getDashboardRange(0, rangeReferenceDate),
        [rangeReferenceDate],
    )
    const latestMonthSelection = useMemo(
        () => getDashboardRangeMonths(latestRange),
        [latestRange],
    )
    const [range, setRange] = useState<DashboardRange>(latestRange)
    const [rangeMode, setRangeMode] = useState<DashboardRangeMode>('six-months')
    const [customStartMonth, setCustomStartMonth] = useState<string>(
        latestMonthSelection.startMonth,
    )
    const [customEndMonth, setCustomEndMonth] = useState<string>(
        latestMonthSelection.endMonth,
    )
    const [rangeErrorMessage, setRangeErrorMessage] = useState<string>()
    const [response, setResponse] = useState<DashboardResponse>()
    const [errorMessage, setErrorMessage] = useState<string>()
    const [isDownloading, setIsDownloading] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [refreshKey, setRefreshKey] = useState<number>(0)
    const rangeMonthCount = useMemo(
        () => getDashboardRangeMonthCount(range),
        [range],
    )
    const nextRange = useMemo(
        () => shiftDashboardRange(range, 1),
        [range],
    )
    const canNavigateNext = nextRange.endDate <= latestRange.endDate

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

    /**
     * Applies a month-aligned range and mirrors it into the custom input draft.
     *
     * @param nextSelectedRange Half-open UTC range to display and export.
     * @returns Nothing.
     * @throws Propagates invalid month-boundary errors from the range utility.
     */
    const applySelectedRange = useCallback((
        nextSelectedRange: DashboardRange,
    ): void => {
        const monthSelection = getDashboardRangeMonths(nextSelectedRange)

        setRange(nextSelectedRange)
        setCustomStartMonth(monthSelection.startMonth)
        setCustomEndMonth(monthSelection.endMonth)
    }, [])

    /**
     * Moves the report backward by its currently selected month count.
     *
     * @returns Nothing.
     * @throws Does not throw for the validated applied range.
     */
    const handlePreviousPeriod = useCallback((): void => {
        setRangeErrorMessage(undefined)
        applySelectedRange(shiftDashboardRange(range, -1))
    }, [applySelectedRange, range])

    /**
     * Moves the report forward by its selected month count when fully available.
     *
     * @returns Nothing.
     * @throws Does not throw for the validated applied range.
     */
    const handleNextPeriod = useCallback(() => {
        if (!canNavigateNext) {
            return
        }

        setRangeErrorMessage(undefined)
        applySelectedRange(nextRange)
    }, [
        applySelectedRange,
        canNavigateNext,
        nextRange,
    ])

    /**
     * Changes between the six-month view and editable custom month controls.
     *
     * Returning to the six-month view immediately restores the latest range;
     * entering custom mode keeps the currently displayed range as the draft.
     *
     * @param event Native range-mode selection event.
     * @returns Nothing.
     * @throws Does not throw.
     */
    const handleRangeModeChange = useCallback((
        event: ChangeEvent<HTMLSelectElement>,
    ): void => {
        const nextMode = event.target.value as DashboardRangeMode

        setRangeMode(nextMode)
        setRangeErrorMessage(undefined)

        if (nextMode === 'six-months') {
            applySelectedRange(latestRange)
        }
    }, [
        applySelectedRange,
        latestRange,
    ])

    /**
     * Updates the unapplied custom start-month draft.
     *
     * @param event Native month input change event.
     * @returns Nothing.
     * @throws Does not throw.
     */
    const handleCustomStartMonthChange = useCallback((
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        setCustomStartMonth(event.target.value)
        setRangeErrorMessage(undefined)
    }, [])

    /**
     * Updates the unapplied custom end-month draft.
     *
     * @param event Native month input change event.
     * @returns Nothing.
     * @throws Does not throw.
     */
    const handleCustomEndMonthChange = useCallback((
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        setCustomEndMonth(event.target.value)
        setRangeErrorMessage(undefined)
    }, [])

    /**
     * Validates and applies the inclusive custom month selection.
     *
     * @param event Custom date-range form submission event.
     * @returns Nothing.
     * @throws Does not throw. Validation failures are rendered beside the inputs.
     */
    const handleApplyCustomRange = useCallback((
        event: FormEvent<HTMLFormElement>,
    ): void => {
        event.preventDefault()

        try {
            const customRange = buildAvailableDashboardRange(
                customStartMonth,
                customEndMonth,
                latestRange,
                latestMonthSelection.endMonth,
            )

            setRangeErrorMessage(undefined)
            applySelectedRange(customRange)
        } catch (error) {
            setRangeErrorMessage(
                error instanceof Error && error.message
                    ? error.message
                    : 'Choose a valid dashboard month range.',
            )
        }
    }, [
        applySelectedRange,
        customEndMonth,
        customStartMonth,
        latestMonthSelection.endMonth,
        latestRange.endDate,
    ])

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

                    <div className={styles.detailActions}>
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

                <section
                    aria-label='Dashboard date range'
                    className={styles.rangePanel}
                >
                    <form
                        className={styles.rangeForm}
                        noValidate
                        onSubmit={handleApplyCustomRange}
                    >
                        <label
                            className={styles.rangeModeField}
                            htmlFor='dashboard-range-mode'
                        >
                            <span>Date Range</span>
                            <select
                                id='dashboard-range-mode'
                                onChange={handleRangeModeChange}
                                value={rangeMode}
                            >
                                <option value='six-months'>6 Months</option>
                                <option value='custom'>Custom Range</option>
                            </select>
                        </label>

                        {rangeMode === 'custom' && (
                            <>
                                <label className={styles.monthField}>
                                    <span className={styles.screenReaderOnly}>
                                        Start month
                                    </span>
                                    <input
                                        aria-describedby={
                                            rangeErrorMessage
                                                ? 'dashboard-range-error'
                                                : undefined
                                        }
                                        aria-invalid={!!rangeErrorMessage}
                                        max={latestMonthSelection.endMonth}
                                        onChange={handleCustomStartMonthChange}
                                        type='month'
                                        value={customStartMonth}
                                    />
                                </label>
                                <span className={styles.rangeSeparator}>to</span>
                                <label className={styles.monthField}>
                                    <span className={styles.screenReaderOnly}>
                                        End month
                                    </span>
                                    <input
                                        aria-describedby={
                                            rangeErrorMessage
                                                ? 'dashboard-range-error'
                                                : undefined
                                        }
                                        aria-invalid={!!rangeErrorMessage}
                                        max={latestMonthSelection.endMonth}
                                        onChange={handleCustomEndMonthChange}
                                        type='month'
                                        value={customEndMonth}
                                    />
                                </label>
                                <Button
                                    disabled={isLoading}
                                    secondary
                                    type='submit'
                                >
                                    Apply
                                </Button>
                            </>
                        )}

                        {rangeErrorMessage && (
                            <span
                                className={styles.rangeInputError}
                                id='dashboard-range-error'
                                role='alert'
                            >
                                {rangeErrorMessage}
                            </span>
                        )}
                    </form>

                    <div className={styles.periodNavigation}>
                        <Button
                            icon={IconOutline.ChevronLeftIcon}
                            iconToLeft
                            onClick={handlePreviousPeriod}
                            secondary
                        >
                            Previous Period
                        </Button>

                        <div className={styles.periodIndicator}>
                            <div>
                                <strong>{formatDashboardRangeLabel(range)}</strong>
                                <span>{formatSelectedMonthCount(rangeMonthCount)}</span>
                            </div>
                            <IconOutline.CalendarIcon aria-hidden='true' />
                        </div>

                        <Button
                            disabled={!canNavigateNext}
                            icon={IconOutline.ChevronRightIcon}
                            onClick={handleNextPeriod}
                            secondary
                        >
                            Next Period
                        </Button>
                    </div>
                </section>

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
