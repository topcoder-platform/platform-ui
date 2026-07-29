/* eslint-disable complexity, ordered-imports/ordered-imports, react/jsx-no-bind */
/**
 * RDS infrastructure storage, connections, events, and sanitized engine logs.
 */
import { FC, useState } from 'react'

import {
    CompleteEmptyState,
    DataFreshness,
    ExternalAwsLink,
    IncompleteDataNotice,
    MetricCard,
    RefreshButton,
    RetryableErrorState,
    StatusLoading,
    StatusPage,
    StatusPanel,
    TimeWindowSelect,
} from '../../lib/components'
import { useDatabaseStatus } from '../../lib/hooks'
import { StatusWindow } from '../../lib/models'
import {
    formatBytes,
    formatRatio,
    formatTimestamp,
} from '../../lib/utils'

import styles from '../StatusPages.module.scss'

/**
 * Renders database status without direct database credentials or SQL queries.
 *
 * @returns active Database Status page.
 * @throws Does not throw; request failures render in the page state.
 */
export const DatabaseStatusPage: FC = () => {
    const [window, setWindow] = useState<StatusWindow>('1h')
    const resource = useDatabaseStatus(window)
    const database = resource.data?.data.database
    const warningCodes: string[] = resource.data?.meta.warnings
        .map(warning => warning.code) ?? []
    const engineLogsComplete: boolean = database?.engineLogsComplete
        ?? !warningCodes.includes('RDS_ENGINE_TELEMETRY_UNAVAILABLE')
    const logicalSizeComplete: boolean = database?.storage.logicalSizeComplete
        ?? (database?.storage.logicalSizeBytes !== null
            && database?.storage.logicalSizeBytes !== undefined
            && !warningCodes.includes('DATABASE_SIZE_INTERPRETATION_PENDING'))

    return (
        <StatusPage
            actions={(
                <>
                    <TimeWindowSelect id='database-window' onChange={setWindow} value={window} />
                    <RefreshButton onRefresh={resource.refresh} refreshing={resource.refreshing} />
                </>
            )}
            description={'Read-only RDS control-plane and sanitized telemetry for the '
                + 'topcoder-services PostgreSQL instance.'}
            title='Database status'
        >
            {resource.error && (
                <RetryableErrorState
                    error={resource.error}
                    hasStaleData={Boolean(resource.data)}
                    onRetry={resource.refresh}
                />
            )}
            {resource.loading && !resource.data && <StatusLoading />}
            {resource.data && !database && (
                <>
                    <DataFreshness meta={resource.data.meta} />
                    <IncompleteDataNotice meta={resource.data.meta} />
                    <CompleteEmptyState>
                        The database monitoring source is not configured. Values remain unknown.
                    </CompleteEmptyState>
                </>
            )}
            {resource.data && database && (
                <>
                    <DataFreshness
                        meta={resource.data.meta}
                        refreshing={resource.refreshing}
                        stale={resource.stale}
                    />
                    <IncompleteDataNotice meta={resource.data.meta} />
                    <div className={styles.metricGrid}>
                        <MetricCard
                            context={`${database.id} · ${database.engine || 'PostgreSQL engine'}${
                                database.engineVersion ? ` ${database.engineVersion}` : ''
                            }`}
                            label='Instance status'
                            state={database.status === 'available'
                                ? 'healthy'
                                : database.status === 'UNKNOWN'
                                    ? 'unknown'
                                    : 'warning'}
                            value={database.status}
                        />
                        <MetricCard
                            context='Provisioned RDS allocation'
                            label='Allocated storage'
                            value={formatBytes(database.storage.allocatedBytes)}
                        />
                        <MetricCard
                            context={`Allocated minus free; sampled ${formatTimestamp(
                                database.storage.sampledAt,
                            )}`}
                            label='RDS storage used'
                            value={formatBytes(database.storage.usedBytes)}
                        />
                        <MetricCard
                            context={`Used ${formatRatio(database.storage.usedRatio)}`}
                            label='Free storage'
                            value={formatBytes(database.storage.freeBytes)}
                        />
                        <MetricCard
                            context={`Sampled ${formatTimestamp(database.connections.sampledAt)}`}
                            label='Connections latest'
                            value={database.connections.latest ?? '—'}
                        />
                        <MetricCard
                            context='Selected window'
                            label='Connections average'
                            value={database.connections.average ?? '—'}
                        />
                        <MetricCard
                            context='Selected window peak'
                            label='Connections maximum'
                            value={database.connections.maximum ?? '—'}
                        />
                        <MetricCard
                            context={logicalSizeComplete
                                ? 'Approved aggregate exporter'
                                : 'Aggregate exporter not configured'}
                            label='Logical database size'
                            state={logicalSizeComplete ? undefined : 'unknown'}
                            value={logicalSizeComplete
                                ? formatBytes(database.storage.logicalSizeBytes)
                                : 'Incomplete'}
                        />
                    </div>
                    <p className={styles.storageExplanation}>
                        <strong>RDS storage used</strong>
                        {' '}
                        is allocated storage minus the latest non-stale
                        CloudWatch FreeStorageSpace sample. It is not a logical
                        {' '}
                        <code>pg_database_size</code>
                        {' '}
                        query. Exact logical size appears separately only
                        when the approved aggregate exporter is configured.
                    </p>
                    <div className={styles.inlineActions}>
                        <ExternalAwsLink href={database.consoleUrl || database.awsUrl}>
                            Open RDS in AWS
                        </ExternalAwsLink>
                    </div>
                    <StatusPanel title='Recent RDS infrastructure events'>
                        {database.events.length > 0
                            ? (
                                <ul className={styles.eventList}>
                                    {database.events.map(event => (
                                        <li key={event.id || `${event.timestamp}:${event.summary}`}>
                                            <time dateTime={event.timestamp || undefined}>
                                                {formatTimestamp(event.timestamp)}
                                            </time>
                                            <span>
                                                {event.categories?.join(', ')
                                                    || event.category
                                                    || event.sourceType
                                                    || 'RDS event'}
                                            </span>
                                            <span>
                                                {event.summary
                                                    || event.message
                                                    || 'No safe summary available'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )
                            : (
                                <CompleteEmptyState>
                                    No RDS infrastructure events were returned for the selected window.
                                </CompleteEmptyState>
                            )}
                    </StatusPanel>
                    <StatusPanel title='PostgreSQL warnings and errors'>
                        {!engineLogsComplete && (
                            <div className={styles.logicalUnknown} role='alert'>
                                Engine-log coverage is incomplete until sanitized PostgreSQL log
                                export is enabled.
                            </div>
                        )}
                        {database.engineMessages.length > 0
                            ? (
                                <ul className={styles.eventList}>
                                    {database.engineMessages.map(message => (
                                        <li
                                            className={styles.engineMessage}
                                            key={message.id || `${message.timestamp}:${message.summary}`}
                                        >
                                            <time dateTime={message.timestamp || undefined}>
                                                {formatTimestamp(message.timestamp)}
                                            </time>
                                            <span className={styles.statusValue}>{message.severity}</span>
                                            <span>
                                                {message.summary}
                                                {' '}
                                                <ExternalAwsLink href={message.cloudWatchUrl}>
                                                    CloudWatch
                                                </ExternalAwsLink>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )
                            : (
                                <CompleteEmptyState>
                                    {!engineLogsComplete
                                        ? 'Engine warnings and errors are unknown because '
                                            + 'the source is incomplete.'
                                        : 'No PostgreSQL warnings or errors were recorded in this complete window.'}
                                </CompleteEmptyState>
                            )}
                    </StatusPanel>
                </>
            )}
        </StatusPage>
    )
}

export default DatabaseStatusPage
