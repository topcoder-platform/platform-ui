/* eslint-disable complexity, ordered-imports/ordered-imports, react/jsx-no-bind */
/**
 * Gateway and ALB API overview with catalogued service drill-down navigation.
 */
import { FC, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
    CompleteEmptyState,
    DataFreshness,
    IncompleteDataNotice,
    MetricCard,
    RefreshButton,
    RetryableErrorState,
    StatusColumn,
    StatusLoading,
    StatusPage,
    StatusPanel,
    StatusTable,
    TimeWindowSelect,
} from '../../lib/components'
import { apiRouteId, buildStatusPath } from '../../config/routes.config'
import { useApiStatus } from '../../lib/hooks'
import { ApiServiceSummary, StatusWindow } from '../../lib/models'
import { formatLatency, formatRatio } from '../../lib/utils'

import styles from '../StatusPages.module.scss'

/**
 * Renders API response classes, latency percentiles, target health, and services.
 *
 * @returns active API overview page.
 * @throws Does not throw; request failures render in the page state.
 */
export const ApiStatusPage: FC = () => {
    const [window, setWindow] = useState<StatusWindow>('1h')
    const resource = useApiStatus(window)
    const navigate = useNavigate()
    const services = resource.data?.data.services ?? []
    const summary = resource.data?.data.summary
    const summaryAvailable: boolean = summary?.dataComplete === true
    const targetHealthAvailable: boolean = Boolean(summary)
        && !resource.data?.meta.warnings.some(warning => (
            warning.code === 'ALB_TARGET_HEALTH_UNAVAILABLE'
            || warning.code === 'API_TELEMETRY_UNAVAILABLE'
        ))

    const columns = useMemo<StatusColumn<ApiServiceSummary>[]>(() => [
        {
            id: 'service',
            label: 'Service',
            render: service => (
                <>
                    <span className={styles.primaryText}>{service.name}</span>
                    <span className={styles.secondaryText}>{service.id}</span>
                </>
            ),
        },
        {
            id: 'requests',
            label: 'Requests',
            render: service => (service.dataComplete ? service.requests.toLocaleString() : '—'),
        },
        {
            id: 'responses',
            label: '2xx / 3xx / 4xx / 5xx',
            render: service => (
                <>
                    <span className={styles.primaryText}>
                        {formatRatio(service.dataComplete ? service.responseRatios.success : undefined)}
                        {' '}
                        /
                        {' '}
                        {formatRatio(service.dataComplete ? service.responseRatios.redirect : undefined)}
                        {' '}
                        /
                        {' '}
                        {formatRatio(service.dataComplete ? service.responseRatios.clientError : undefined)}
                        {' '}
                        /
                        {' '}
                        {formatRatio(service.dataComplete ? service.responseRatios.serverError : undefined)}
                    </span>
                    <span className={styles.secondaryText}>
                        Counts:
                        {' '}
                        {service.dataComplete ? service.responseCounts.success : '—'}
                        {' '}
                        /
                        {' '}
                        {service.dataComplete ? service.responseCounts.redirect : '—'}
                        {' / '}
                        {service.dataComplete ? service.responseCounts.clientError : '—'}
                        {' '}
                        /
                        {' '}
                        {service.dataComplete ? service.responseCounts.serverError : '—'}
                    </span>
                </>
            ),
        },
        {
            id: 'latency',
            label: 'Response p50 / p95 / p99',
            render: service => (
                <>
                    <span>
                        {formatLatency(service.dataComplete ? service.latencyMs.response.p50 : undefined)}
                        {' '}
                        /
                        {' '}
                    </span>
                    <span>
                        {formatLatency(service.dataComplete ? service.latencyMs.response.p95 : undefined)}
                        {' '}
                        /
                        {' '}
                    </span>
                    <span>
                        {formatLatency(service.dataComplete ? service.latencyMs.response.p99 : undefined)}
                    </span>
                    <span className={styles.sourceLabel}>Gateway response latency</span>
                </>
            ),
        },
        {
            id: 'integration',
            label: 'Integration p50 / p95 / p99',
            render: service => (
                <>
                    <span>
                        {formatLatency(service.dataComplete ? service.latencyMs.integration.p50 : undefined)}
                        {' '}
                        /
                        {' '}
                    </span>
                    <span>
                        {formatLatency(service.dataComplete ? service.latencyMs.integration.p95 : undefined)}
                        {' '}
                        /
                        {' '}
                    </span>
                    <span>
                        {formatLatency(service.dataComplete ? service.latencyMs.integration.p99 : undefined)}
                    </span>
                    <span className={styles.sourceLabel}>Gateway integration latency</span>
                </>
            ),
        },
        {
            id: 'targets',
            label: 'Targets healthy / unhealthy',
            render: service => (service.targetHealth.unknown
                ? 'Unknown'
                : (
                    <span>
                        {service.targetHealth.healthy ?? '—'}
                        {' '}
                        /
                        {service.targetHealth.unhealthy ?? '—'}
                    </span>
                )),
        },
        {
            id: 'coverage',
            label: 'Coverage',
            render: service => (service.dataComplete === false ? 'Incomplete' : 'Complete'),
        },
    ], [])

    return (
        <StatusPage
            actions={(
                <>
                    <TimeWindowSelect id='api-window' onChange={setWindow} value={window} />
                    <RefreshButton onRefresh={resource.refresh} refreshing={resource.refreshing} />
                </>
            )}
            description='End-to-end Gateway request classes, ALB target health, and response latency by service.'
            title='API status'
        >
            {resource.error && (
                <RetryableErrorState
                    error={resource.error}
                    hasStaleData={Boolean(resource.data)}
                    onRetry={resource.refresh}
                />
            )}
            {resource.loading && !resource.data && <StatusLoading />}
            {resource.data && (
                <>
                    <DataFreshness
                        meta={resource.data.meta}
                        refreshing={resource.refreshing}
                        stale={resource.stale}
                    />
                    <IncompleteDataNotice meta={resource.data.meta} />
                    <div className={styles.metricGrid}>
                        <MetricCard
                            context='Gateway requests in selected window'
                            label='Total requests'
                            value={summaryAvailable ? summary?.requests.toLocaleString() : '—'}
                        />
                        <MetricCard
                            context='All HTTP 2xx responses'
                            label='2xx success ratio'
                            state={summaryAvailable
                                && summary?.responseRatios.success !== null
                                && summary?.responseRatios.success !== undefined
                                && summary.responseRatios.success < 0.95
                                ? 'warning'
                                : undefined}
                            value={formatRatio(summaryAvailable
                                ? summary?.responseRatios.success
                                : undefined)}
                        />
                        <MetricCard
                            context='Client-side response class'
                            label='4xx ratio'
                            value={formatRatio(summaryAvailable
                                ? summary?.responseRatios.clientError
                                : undefined)}
                        />
                        <MetricCard
                            context='Server-side response class'
                            label='5xx ratio'
                            state={summaryAvailable
                                && summary?.responseRatios.serverError !== null
                                && summary?.responseRatios.serverError !== undefined
                                && summary.responseRatios.serverError > 0
                                ? 'critical'
                                : undefined}
                            value={formatRatio(summaryAvailable
                                ? summary?.responseRatios.serverError
                                : undefined)}
                        />
                        <MetricCard
                            context='Gateway response latency'
                            label='p50 latency'
                            value={formatLatency(summaryAvailable
                                ? summary?.latencyMs.response.p50
                                : undefined)}
                        />
                        <MetricCard
                            context='Gateway response latency'
                            label='p95 latency'
                            value={formatLatency(summaryAvailable
                                ? summary?.latencyMs.response.p95
                                : undefined)}
                        />
                        <MetricCard
                            context={`Healthy: ${targetHealthAvailable
                                ? summary?.healthyTargets ?? '—'
                                : '—'}`}
                            label='Unhealthy ALB targets'
                            state={targetHealthAvailable
                                && summary?.unhealthyTargets
                                ? 'critical'
                                : undefined}
                            value={targetHealthAvailable
                                ? summary?.unhealthyTargets ?? '—'
                                : '—'}
                        />
                    </div>
                    {!summaryAvailable && (
                        <div className={styles.coverageIncomplete} role='alert'>
                            Overview aggregate is unavailable; service percentiles are not combined
                            into a false global value.
                        </div>
                    )}
                    {!targetHealthAvailable && (
                        <div className={styles.coverageIncomplete} role='alert'>
                            ALB target health is unknown for one or more services; zero is not assumed.
                        </div>
                    )}
                    <StatusPanel title='Services'>
                        {services.length > 0
                            ? (
                                <StatusTable
                                    caption='API service status'
                                    columns={columns}
                                    getKey={service => service.id}
                                    getRowLabel={service => `View endpoints for ${service.name}`}
                                    onRowClick={service => navigate(buildStatusPath(apiRouteId, service.id))}
                                    rows={services}
                                />
                            )
                            : (
                                <CompleteEmptyState>
                                    {resource.data.meta.complete
                                        ? 'No API requests were recorded in this complete window.'
                                        : 'No API service aggregates are available from the incomplete source.'}
                                </CompleteEmptyState>
                            )}
                    </StatusPanel>
                </>
            )}
        </StatusPage>
    )
}

export default ApiStatusPage
