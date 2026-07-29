/* eslint-disable complexity, ordered-imports/ordered-imports, react/jsx-no-bind */
/**
 * Route-template endpoint aggregates for one catalogued API service.
 */
import { FC, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
    CompleteEmptyState,
    DataFreshness,
    IncompleteDataNotice,
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
import { useApiEndpointStatus } from '../../lib/hooks'
import { ApiEndpointSummary, StatusWindow } from '../../lib/models'
import { formatLatency, formatRatio } from '../../lib/utils'

import styles from '../StatusPages.module.scss'

/**
 * Renders endpoint telemetry grouped only by safe method and route template.
 *
 * @returns routed service endpoint page.
 * @throws Does not throw; request failures render in the page state.
 */
export const ApiEndpointsPage: FC = () => {
    const serviceId: string | undefined = useParams<{ serviceId: string }>().serviceId
    const [window, setWindow] = useState<StatusWindow>('1h')
    const resource = useApiEndpointStatus(serviceId, window)
    const navigate = useNavigate()
    const data = resource.data?.data
    const coverageComplete = Boolean(data?.coverage.complete ?? (
        data && data.coverage.unattributedEdgeFailures === 0 && resource.data?.meta.complete
    ))
    const coverageAvailable = Boolean(data) && !resource.data?.meta.warnings.some(warning => (
        warning.code === 'ENDPOINT_TELEMETRY_UNAVAILABLE'
        || warning.code.startsWith('QUERY_')
    ))
    const columns = useMemo<StatusColumn<ApiEndpointSummary>[]>(() => [
        {
            id: 'endpoint',
            label: 'Endpoint',
            render: endpoint => (
                <>
                    <span className={styles.method}>{endpoint.method}</span>
                    <span className={styles.routeTemplate}>{endpoint.routeTemplate}</span>
                </>
            ),
        },
        {
            id: 'requests',
            label: 'Requests',
            render: endpoint => (endpoint.dataComplete ? endpoint.requests.toLocaleString() : '—'),
        },
        {
            id: 'responses',
            label: '2xx / 4xx / 5xx',
            render: endpoint => (
                <>
                    {formatRatio(endpoint.dataComplete ? endpoint.responseRatios.success : undefined)}
                    {' '}
                    /
                    {' '}
                    {formatRatio(endpoint.dataComplete ? endpoint.responseRatios.clientError : undefined)}
                    {' '}
                    /
                    {' '}
                    {formatRatio(endpoint.dataComplete ? endpoint.responseRatios.serverError : undefined)}
                </>
            ),
        },
        {
            id: 'responseLatency',
            label: 'Response p50 / p95 / p99',
            render: endpoint => (
                <>
                    {formatLatency(endpoint.dataComplete ? endpoint.latencyMs.response.p50 : undefined)}
                    {' '}
                    /
                    {' '}
                    {formatLatency(endpoint.dataComplete ? endpoint.latencyMs.response.p95 : undefined)}
                    {' '}
                    /
                    {' '}
                    {formatLatency(endpoint.dataComplete ? endpoint.latencyMs.response.p99 : undefined)}
                    <span className={styles.sourceLabel}>Gateway/application response</span>
                </>
            ),
        },
        {
            id: 'integrationLatency',
            label: 'Integration p50 / p95 / p99',
            render: endpoint => (
                <>
                    {formatLatency(endpoint.dataComplete ? endpoint.latencyMs.integration.p50 : undefined)}
                    {' '}
                    /
                    {' '}
                    {formatLatency(endpoint.dataComplete ? endpoint.latencyMs.integration.p95 : undefined)}
                    {' '}
                    /
                    {' '}
                    {formatLatency(endpoint.dataComplete ? endpoint.latencyMs.integration.p99 : undefined)}
                    <span className={styles.sourceLabel}>Gateway integration</span>
                </>
            ),
        },
        {
            id: 'failures',
            label: 'Recent failures',
            render: endpoint => (endpoint.dataComplete
                ? endpoint.recentFailureCount
                    ?? endpoint.responseCounts.clientError + endpoint.responseCounts.serverError
                : '—'),
        },
    ], [])

    return (
        <StatusPage
            actions={(
                <>
                    <TimeWindowSelect id='endpoint-window' onChange={setWindow} value={window} />
                    <RefreshButton onRefresh={resource.refresh} refreshing={resource.refreshing} />
                </>
            )}
            backLabel='Back to API services'
            backTo={buildStatusPath(apiRouteId)}
            description={'Stable route-template aggregates; raw identifier-bearing request paths '
                + 'are never used as endpoint identities.'}
            title={data ? `${data.service.name} endpoints` : 'API endpoints'}
        >
            {resource.error && (
                <RetryableErrorState
                    error={resource.error}
                    hasStaleData={Boolean(resource.data)}
                    onRetry={resource.refresh}
                />
            )}
            {resource.loading && !resource.data && <StatusLoading />}
            {resource.data && data && (
                <>
                    <DataFreshness
                        meta={resource.data.meta}
                        refreshing={resource.refreshing}
                        stale={resource.stale}
                    />
                    <IncompleteDataNotice
                        message={coverageAvailable
                            ? 'Some edge failures could not be safely attributed to a route template, '
                                + 'so endpoint ratios are incomplete.'
                            : 'Endpoint attribution telemetry is unavailable or incomplete; '
                                + 'missing counts and ratios are unknown.'}
                        meta={{ ...resource.data.meta, complete: resource.data.meta.complete && coverageComplete }}
                    />
                    <div className={coverageComplete
                        ? styles.coverage
                        : `${styles.coverage} ${styles.coverageIncomplete}`}
                    >
                        <strong>Endpoint attribution coverage</strong>
                        <span>
                            {coverageAvailable
                                ? data.coverage.attributedRequests.toLocaleString()
                                : '—'}
                            {' '}
                            attributed requests
                        </span>
                        <span>
                            {coverageAvailable
                                ? data.coverage.unattributedEdgeFailures.toLocaleString()
                                : '—'}
                            {' '}
                            EDGE_UNATTRIBUTED failures
                        </span>
                        <span>{coverageComplete ? 'Complete' : 'Incomplete'}</span>
                    </div>
                    <StatusPanel title='Endpoints'>
                        {data.endpoints.length > 0
                            ? (
                                <StatusTable
                                    caption={`Endpoints for ${data.service.name}`}
                                    columns={columns}
                                    getKey={endpoint => endpoint.id}
                                    getRowLabel={endpoint => (
                                        `View recent failures for ${endpoint.method} ${endpoint.routeTemplate}`
                                    )}
                                    onRowClick={endpoint => navigate(buildStatusPath(
                                        apiRouteId,
                                        data.service.id,
                                        'endpoints',
                                        endpoint.id,
                                    ))}
                                    rows={data.endpoints}
                                />
                            )
                            : (
                                <CompleteEmptyState>
                                    {resource.data.meta.complete && coverageComplete
                                        ? 'No endpoint requests were recorded in this complete window.'
                                        : 'No endpoint rows are available from the incomplete telemetry source.'}
                                </CompleteEmptyState>
                            )}
                    </StatusPanel>
                </>
            )}
        </StatusPage>
    )
}

export default ApiEndpointsPage
