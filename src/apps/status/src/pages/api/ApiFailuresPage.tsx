/* eslint-disable ordered-imports/ordered-imports, react/jsx-no-bind */
/**
 * Bounded, sanitized failure records for one safe API endpoint identity.
 */
import { FC, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

import {
    CompleteEmptyState,
    DataFreshness,
    ExternalAwsLink,
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
import { useApiFailures } from '../../lib/hooks'
import { ApiFailureRecord, StatusWindow } from '../../lib/models'
import { formatLatency, formatTimestamp } from '../../lib/utils'

import styles from '../StatusPages.module.scss'

/**
 * Renders only allowlisted plain-text failure fields returned by status-api-v6.
 *
 * @returns routed endpoint failure page.
 * @throws Does not throw; request failures render in the page state.
 */
export const ApiFailuresPage: FC = () => {
    const params = useParams<{
        endpointId: string
        serviceId: string
    }>()
    const endpointId: string | undefined = params.endpointId
    const serviceId: string | undefined = params.serviceId
    const [window, setWindow] = useState<StatusWindow>('1h')
    const resource = useApiFailures(serviceId, endpointId, window)
    const data = resource.data?.data
    const columns = useMemo<StatusColumn<ApiFailureRecord>[]>(() => [
        {
            id: 'time',
            label: 'Time / request ID',
            render: failure => (
                <>
                    <span className={styles.primaryText}>{formatTimestamp(failure.timestamp)}</span>
                    <span className={styles.requestId}>{failure.requestId}</span>
                </>
            ),
        },
        {
            id: 'endpoint',
            label: 'Endpoint',
            render: failure => (
                <>
                    <span className={styles.method}>{failure.method}</span>
                    <span className={styles.routeTemplate}>{failure.routeTemplate}</span>
                </>
            ),
        },
        {
            id: 'status',
            label: 'HTTP status',
            render: failure => (
                <>
                    <span className={styles.primaryText}>{failure.statusCode}</span>
                    <span className={styles.secondaryText}>{failure.responseClass}</span>
                </>
            ),
        },
        {
            id: 'reason',
            label: 'Safe reason',
            render: failure => (
                <>
                    <span className={styles.primaryText}>
                        {failure.errorCode || failure.errorType || 'Unclassified failure'}
                    </span>
                    <span className={styles.reason}>
                        {failure.errorSummary || 'No safe summary is available.'}
                    </span>
                </>
            ),
        },
        {
            id: 'latency',
            label: 'Response / integration',
            render: failure => (
                <>
                    <span>{formatLatency(failure.responseLatencyMs)}</span>
                    <span className={styles.sourceLabel}>Response</span>
                    <span>{formatLatency(failure.integrationLatencyMs)}</span>
                    <span className={styles.sourceLabel}>Integration/application</span>
                </>
            ),
        },
        {
            id: 'logs',
            label: 'Logs',
            render: failure => (
                <ExternalAwsLink
                    ariaLabel={`Open CloudWatch logs for request ${failure.requestId}`}
                    href={failure.cloudWatchUrl}
                >
                    CloudWatch
                </ExternalAwsLink>
            ),
        },
    ], [])

    const endpointBackPath = serviceId
        ? buildStatusPath(apiRouteId, serviceId)
        : buildStatusPath(apiRouteId)
    const title = data
        ? `${data.endpoint.method} ${data.endpoint.routeTemplate} failures`
        : 'Endpoint failures'

    return (
        <StatusPage
            actions={(
                <>
                    <TimeWindowSelect id='failure-window' onChange={setWindow} value={window} />
                    <RefreshButton onRefresh={resource.refresh} refreshing={resource.refreshing} />
                </>
            )}
            backLabel='Back to endpoints'
            backTo={endpointBackPath}
            description={'Bounded safe failure details. Bodies, headers, query strings, source IPs, '
                + 'agents, and stack traces are never rendered.'}
            title={title}
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
                    <IncompleteDataNotice meta={resource.data.meta} />
                    <StatusPanel title={`Recent failures (${data.failures.length})`}>
                        {data.failures.length > 0
                            ? (
                                <StatusTable
                                    caption={title}
                                    columns={columns}
                                    getKey={failure => `${failure.timestamp}:${failure.requestId}`}
                                    rows={data.failures}
                                />
                            )
                            : (
                                <CompleteEmptyState>
                                    {resource.data.meta.complete
                                        ? 'No failures were recorded in this complete window.'
                                        : 'No failure rows are available from the incomplete telemetry source.'}
                                </CompleteEmptyState>
                            )}
                    </StatusPanel>
                </>
            )}
        </StatusPage>
    )
}

export default ApiFailuresPage
