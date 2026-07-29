/* eslint-disable ordered-imports/ordered-imports, react/jsx-no-bind */
/* eslint-disable react/no-unstable-nested-components, unicorn/no-null */
/**
 * Failure-first ECS service overview with lazy task inventory and task details.
 */
import {
    FC,
    MouseEvent,
    useEffect,
    useMemo,
    useState,
} from 'react'

import {
    CompleteEmptyState,
    DataFreshness,
    ExternalAwsLink,
    HealthBadge,
    IncompleteDataNotice,
    RefreshButton,
    RetryableErrorState,
    StatusColumn,
    StatusLoading,
    StatusPage,
    StatusPanel,
    StatusTable,
} from '../../lib/components'
import { useEcsStatus, useEcsTaskDetail, useEcsTasks } from '../../lib/hooks'
import {
    EcsServiceSummary,
    EcsTaskSummary,
    StatusSeverity,
} from '../../lib/models'
import {
    formatReasons,
    formatTimestamp,
    sortBySeverity,
} from '../../lib/utils'

import styles from '../StatusPages.module.scss'

interface ServiceRow extends EcsServiceSummary {
    clusterName: string
}

interface EcsFilters {
    search: string
    clusterId: string
    severity: '' | StatusSeverity
    taskStatus: string
    taskDefinition: string
    issuesOnly: boolean
}

const INITIAL_FILTERS: EcsFilters = {
    clusterId: '',
    issuesOnly: false,
    search: '',
    severity: '',
    taskDefinition: '',
    taskStatus: '',
}

/**
 * Builds the non-color task status label announced by the table row.
 *
 * @param task task row to describe for assistive technology.
 * @returns severity, identity, and safe reasons in one label.
 * @throws Does not throw.
 */
function getTaskRowLabel(task: EcsTaskSummary): string {
    const taskId = task.opaqueTaskId || task.id
    return `${task.severity} task ${taskId}: ${formatReasons(task.severityReasons)}`
}

/**
 * Builds the non-color service status label announced by the table row.
 *
 * @param service service row to describe for assistive technology.
 * @returns severity, service name, and safe reasons in one label.
 * @throws Does not throw.
 */
function getServiceRowLabel(service: ServiceRow): string {
    return `${service.severity} service ${service.name}: ${formatReasons(service.severityReasons)}`
}

/**
 * Formats the API's generic exit interpretation for task failure display.
 *
 * @param interpretation structured or legacy generic interpretation.
 * @returns safe summary text, or an explicit unknown message.
 * @throws Does not throw.
 */
function getExitInterpretation(
    interpretation: EcsTaskSummary['containers'][number]['exitInterpretation'],
): string {
    if (!interpretation) {
        return 'No generic interpretation is available.'
    }

    return typeof interpretation === 'string' ? interpretation : interpretation.summary
}

/**
 * Formats a nullable task-definition identity without manufacturing a revision.
 *
 * @param taskDefinition task-owned definition identity.
 * @returns family/revision or an explicit unknown label.
 * @throws Does not throw.
 */
function getTaskDefinitionLabel(taskDefinition: EcsTaskSummary['taskDefinition']): string {
    return taskDefinition
        ? `${taskDefinition.family}:${taskDefinition.revision}`
        : 'Unknown task definition'
}

/**
 * Deduplicates cursor pages by opaque task ID while preserving insertion order.
 *
 * @param tasks combined task pages.
 * @returns one current row per task ID.
 * @throws Does not throw.
 */
function deduplicateTasks(tasks: EcsTaskSummary[]): EcsTaskSummary[] {
    const tasksById = tasks.reduce<Record<string, EcsTaskSummary>>((result, task) => {
        result[task.id] = task
        return result
    }, {})
    return Object.keys(tasksById)
        .map(taskId => tasksById[taskId])
}

/**
 * Renders a task's server-sanitized failure details and links.
 *
 * @param props selected task ID.
 * @returns task detail request state and content.
 * @throws Does not throw; request failures render in the component state.
 */
const TaskDetailPanel: FC<{ taskId: string }> = props => {
    const resource = useEcsTaskDetail(props.taskId)
    if (resource.loading) {
        return <StatusLoading />
    }

    if (resource.error && !resource.data) {
        return <RetryableErrorState error={resource.error} onRetry={resource.refresh} />
    }

    const task = resource.data?.data.task
    if (!task || !resource.data) {
        return null
    }

    return (
        <div className={styles.detailPanel}>
            <h3>Task failure detail</h3>
            <DataFreshness meta={resource.data.meta} stale={resource.stale} />
            <IncompleteDataNotice meta={resource.data.meta} />
            <dl className={styles.detailGrid}>
                <div>
                    <dt>Task ID</dt>
                    <dd>{task.opaqueTaskId || task.id}</dd>
                </div>
                <div>
                    <dt>ECS stop code</dt>
                    <dd>{task.stopCode || 'Not reported'}</dd>
                </div>
                <div>
                    <dt>Sanitized reason</dt>
                    <dd>{task.stoppedReason || 'No safe reason available'}</dd>
                </div>
                <div>
                    <dt>Stopped</dt>
                    <dd>{formatTimestamp(task.stoppedAt)}</dd>
                </div>
                <div>
                    <dt>Task definition</dt>
                    <dd>{getTaskDefinitionLabel(task.taskDefinition)}</dd>
                </div>
            </dl>
            {task.containers.map(container => (
                <dl className={styles.detailGrid} key={container.name}>
                    <div>
                        <dt>Container</dt>
                        <dd>{container.name}</dd>
                    </div>
                    <div>
                        <dt>Container state</dt>
                        <dd>{container.lastStatus}</dd>
                    </div>
                    <div>
                        <dt>Exit code</dt>
                        <dd>{container.exitCode ?? 'Not reported'}</dd>
                    </div>
                    <div>
                        <dt>Generic interpretation</dt>
                        <dd>{getExitInterpretation(container.exitInterpretation)}</dd>
                    </div>
                </dl>
            ))}
            <div className={styles.inlineActions}>
                <ExternalAwsLink href={task.taskDefinition?.url}>Task definition</ExternalAwsLink>
                <ExternalAwsLink href={task.cloudWatchUrl}>CloudWatch logs</ExternalAwsLink>
            </div>
        </div>
    )
}

/**
 * Loads and renders the task inventory for one expanded ECS service.
 *
 * @param props service, task-status filter, and task-definition filter.
 * @returns lazy task table with cursor pagination.
 * @throws Does not throw; request failures render in the component state.
 */
const ServiceTaskInventory: FC<{
    service: ServiceRow
    taskStatus: string
    taskDefinition: string
}> = props => {
    const [cursor, setCursor] = useState<string | undefined>()
    const [tasks, setTasks] = useState<EcsTaskSummary[]>([])
    const [selectedTaskId, setSelectedTaskId] = useState<string>()
    const query = useMemo(() => ({
        clusterId: props.service.clusterId,
        cursor,
        limit: 50,
        serviceId: props.service.id,
        status: props.taskStatus || undefined,
        taskDefinition: props.taskDefinition || undefined,
    }), [cursor, props.service.clusterId, props.service.id, props.taskDefinition, props.taskStatus])
    const resource = useEcsTasks(query, true)

    useEffect(() => {
        setCursor(undefined)
        setTasks([])
        setSelectedTaskId(undefined)
    }, [props.service.id, props.taskDefinition, props.taskStatus])

    useEffect(() => {
        const page = resource.data?.data.tasks
        if (!page) {
            return
        }

        setTasks(current => {
            const merged = cursor ? [...current, ...page] : page
            return deduplicateTasks(merged)
        })
    }, [cursor, resource.data])

    const taskColumns = useMemo<StatusColumn<EcsTaskSummary>[]>(() => [
        {
            id: 'health',
            label: 'Health',
            render: task => (
                <>
                    <HealthBadge severity={task.severity} />
                    <span className={styles.reason}>{formatReasons(task.severityReasons)}</span>
                </>
            ),
        },
        {
            id: 'task',
            label: 'Task',
            render: task => (
                <>
                    <span className={styles.primaryText}>{task.opaqueTaskId || task.id}</span>
                    <span className={styles.secondaryText}>{task.launchType || 'Launch type unknown'}</span>
                    <ExternalAwsLink href={task.taskUrl}>Task in AWS</ExternalAwsLink>
                </>
            ),
        },
        {
            id: 'state',
            label: 'State / deployment',
            render: task => (
                <>
                    <span className={styles.primaryText}>{task.lastStatus}</span>
                    <span className={styles.secondaryText}>
                        Desired:
                        {' '}
                        {task.desiredStatus || 'unknown'}
                    </span>
                    <span className={styles.secondaryText}>
                        Health:
                        {' '}
                        {task.healthStatus || 'unknown'}
                    </span>
                    <span className={styles.secondaryText}>
                        Deployment:
                        {' '}
                        {task.deploymentId || 'not reported'}
                    </span>
                </>
            ),
        },
        {
            id: 'time',
            label: 'Launch / stop time',
            render: task => formatTimestamp(task.stoppedAt || task.launchedAt || task.startedAt),
        },
        {
            id: 'definition',
            label: 'Task definition',
            render: task => (
                <>
                    <span className={styles.primaryText}>
                        {getTaskDefinitionLabel(task.taskDefinition)}
                    </span>
                    <ExternalAwsLink href={task.taskDefinition?.url}>AWS</ExternalAwsLink>
                </>
            ),
        },
        {
            id: 'container',
            label: 'Container / exit',
            render: task => (task.containers.length > 0
                ? task.containers.map(container => (
                    <span className={styles.secondaryText} key={container.name}>
                        {container.name}
                        :
                        {container.lastStatus}
                        , exit
                        {' '}
                        {container.exitCode ?? '—'}
                    </span>
                ))
                : '—'),
        },
    ], [])

    return (
        <div className={styles.taskInventory}>
            <h3>
                Task inventory for
                {' '}
                {props.service.name}
            </h3>
            {resource.error && (
                <RetryableErrorState
                    error={resource.error}
                    hasStaleData={tasks.length > 0}
                    onRetry={resource.refresh}
                />
            )}
            {resource.loading && tasks.length === 0 && <StatusLoading />}
            {resource.data && (
                <>
                    <DataFreshness
                        meta={resource.data.meta}
                        refreshing={resource.refreshing}
                        stale={resource.stale}
                    />
                    <IncompleteDataNotice meta={resource.data.meta} />
                </>
            )}
            {tasks.length > 0 && (
                <StatusTable
                    caption={`Tasks for ${props.service.name}`}
                    columns={taskColumns}
                    getKey={task => task.id}
                    getRowLabel={getTaskRowLabel}
                    getSeverity={task => task.severity}
                    onRowClick={task => setSelectedTaskId(
                        selectedTaskId === task.id ? undefined : task.id,
                    )}
                    rows={sortBySeverity(tasks, task => task.severity)}
                />
            )}
            {!resource.loading && !resource.error && tasks.length === 0 && (
                <CompleteEmptyState>
                    {resource.data?.meta.complete
                        ? 'No tasks match the selected filters.'
                        : 'No task rows are available from the incomplete monitoring source.'}
                </CompleteEmptyState>
            )}
            {resource.data?.data.nextCursor && (
                <div className={styles.loadMoreWrap}>
                    <button
                        className={styles.loadMoreButton}
                        disabled={resource.loading || resource.refreshing}
                        onClick={() => setCursor(resource.data?.data.nextCursor || undefined)}
                        type='button'
                    >
                        Load more retained tasks
                    </button>
                </div>
            )}
            {selectedTaskId && <TaskDetailPanel taskId={selectedTaskId} />}
        </div>
    )
}

/**
 * Renders the ECS Status page with local filters and failure-first service ordering.
 *
 * @returns active ECS page.
 * @throws Does not throw; request failures render in the page state.
 */
export const EcsStatusPage: FC = () => {
    const resource = useEcsStatus()
    const [filters, setFilters] = useState<EcsFilters>(INITIAL_FILTERS)
    const [expandedServiceId, setExpandedServiceId] = useState<string>()
    const clusters = useMemo(
        () => resource.data?.data.clusters ?? [],
        [resource.data?.data.clusters],
    )
    const services = useMemo<ServiceRow[]>(() => clusters.flatMap(cluster => (
        cluster.services.map(service => ({
            ...service,
            clusterName: service.clusterName || cluster.name,
        }))
    )), [clusters])
    const visibleServices = useMemo(() => {
        const search = filters.search.trim()
            .toLowerCase()
        return sortBySeverity(
            services.filter(service => {
                const definition = service.taskDefinition
                    ? `${service.taskDefinition.family}:${service.taskDefinition.revision}`
                    : ''
                return (!search || [
                    service.clusterName,
                    service.name,
                    definition,
                ].some(value => value.toLowerCase()
                    .includes(search)))
                    && (!filters.clusterId || service.clusterId === filters.clusterId)
                    && (!filters.severity || service.severity === filters.severity)
                    && (!filters.issuesOnly
                        || ['critical', 'warning', 'unknown'].includes(service.severity))
            }),
            service => service.severity,
            (left, right) => left.name.localeCompare(right.name),
        )
    }, [filters, services])

    const serviceColumns = useMemo<StatusColumn<ServiceRow>[]>(() => [
        {
            id: 'severity',
            label: 'Status',
            render: service => (
                <>
                    <HealthBadge severity={service.severity} />
                    <span className={service.severity === 'critical'
                        ? styles.criticalReason
                        : styles.reason}
                    >
                        {formatReasons(service.severityReasons)}
                    </span>
                </>
            ),
        },
        {
            id: 'service',
            label: 'Cluster / service',
            render: service => (
                <>
                    <span className={styles.primaryText}>{service.name}</span>
                    <span className={styles.secondaryText}>{service.clusterName}</span>
                </>
            ),
        },
        {
            id: 'tasks',
            label: 'Tasks D / R / P / stopped',
            render: service => (
                <span className={styles.counts}>
                    {service.desiredCount ?? '—'}
                    {' '}
                    /
                    {service.runningCount ?? '—'}
                    {' '}
                    /
                    {service.pendingCount ?? '—'}
                    {' / '}
                    {service.recentStoppedCount ?? '—'}
                </span>
            ),
        },
        {
            id: 'deployment',
            label: 'Latest deployment',
            render: service => (
                <>
                    <span className={styles.primaryText}>
                        {service.latestDeployment?.status || 'No deployment available'}
                    </span>
                    {service.latestDeployment && (
                        <span className={styles.secondaryText}>
                            {formatTimestamp(service.latestDeployment.finishedAt
                                || service.latestDeployment.startedAt)}
                        </span>
                    )}
                    {service.latestDeployment?.reason && (
                        <span className={styles.reason}>{service.latestDeployment.reason}</span>
                    )}
                </>
            ),
        },
        {
            id: 'deployCount',
            label: 'Deploys 24h / 7d',
            render: service => (
                <span>
                    {service.deploymentCounts.last24Hours}
                    {' '}
                    /
                    {' '}
                    {service.deploymentCounts.last7Days}
                </span>
            ),
        },
        {
            id: 'definition',
            label: 'Task definition',
            render: service => (
                <>
                    <span className={styles.primaryText}>
                        {getTaskDefinitionLabel(service.taskDefinition)}
                    </span>
                    <ExternalAwsLink href={service.taskDefinition?.url}>AWS</ExternalAwsLink>
                </>
            ),
        },
        {
            id: 'failure',
            label: 'Latest failure',
            render: service => (!service.stoppedHistoryComplete
                ? <span className={styles.secondaryText}>Failure history incomplete</span>
                : service.latestFailure
                    ? (
                        <>
                            <span className={styles.primaryText}>
                                {service.latestFailure.stopCode || 'Task stopped'}
                            </span>
                            <span className={styles.reason}>
                                {service.latestFailure.reason
                                    || service.latestFailure.stoppedReason
                                    || 'No safe reason available'}
                            </span>
                            <span className={styles.secondaryText}>
                                {formatTimestamp(
                                    service.latestFailure.timestamp || service.latestFailure.stoppedAt,
                                )}
                            </span>
                            <ExternalAwsLink href={service.latestFailure.cloudWatchUrl}>Logs</ExternalAwsLink>
                        </>
                    )
                    : <span className={styles.secondaryText}>No recent failure</span>),
        },
        {
            id: 'actions',
            label: 'Tasks',
            render: service => (
                <button
                    aria-expanded={expandedServiceId === service.id}
                    className={styles.linkButton}
                    onClick={(event: MouseEvent<HTMLButtonElement>) => {
                        event.stopPropagation()
                        setExpandedServiceId(current => (current === service.id ? undefined : service.id))
                    }}
                    type='button'
                >
                    {expandedServiceId === service.id ? 'Hide' : 'View'}
                    {' '}
                    tasks
                </button>
            ),
        },
    ], [expandedServiceId])

    return (
        <StatusPage
            actions={<RefreshButton onRefresh={resource.refresh} refreshing={resource.refreshing} />}
            description={'Live services, deployments, rolling task revisions, and retained failures. '
                + 'Critical issues remain first.'}
            title='ECS status'
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
                    <StatusPanel title='Services and tasks'>
                        <div className={styles.filters}>
                            <label htmlFor='ecs-search'>
                                Search
                                <input
                                    id='ecs-search'
                                    onChange={event => setFilters(current => ({
                                        ...current,
                                        search: event.target.value,
                                    }))}
                                    placeholder='Cluster, service, task definition'
                                    type='search'
                                    value={filters.search}
                                />
                            </label>
                            <label htmlFor='ecs-cluster'>
                                Cluster
                                <select
                                    id='ecs-cluster'
                                    onChange={event => setFilters(current => ({
                                        ...current,
                                        clusterId: event.target.value,
                                    }))}
                                    value={filters.clusterId}
                                >
                                    <option value=''>All clusters</option>
                                    {clusters.map(cluster => (
                                        <option key={cluster.id} value={cluster.id}>{cluster.name}</option>
                                    ))}
                                </select>
                            </label>
                            <label htmlFor='ecs-severity'>
                                Severity
                                <select
                                    id='ecs-severity'
                                    onChange={event => setFilters(current => ({
                                        ...current,
                                        severity: event.target.value as EcsFilters['severity'],
                                    }))}
                                    value={filters.severity}
                                >
                                    <option value=''>All states</option>
                                    <option value='critical'>Critical</option>
                                    <option value='warning'>Warning</option>
                                    <option value='unknown'>Unknown</option>
                                    <option value='healthy-change'>Healthy · recent change</option>
                                    <option value='healthy'>Healthy</option>
                                </select>
                            </label>
                            <label htmlFor='ecs-task-status'>
                                Expanded task status
                                <select
                                    id='ecs-task-status'
                                    onChange={event => setFilters(current => ({
                                        ...current,
                                        taskStatus: event.target.value,
                                    }))}
                                    value={filters.taskStatus}
                                >
                                    <option value=''>All task states</option>
                                    <option value='RUNNING'>Running</option>
                                    <option value='PENDING'>Pending</option>
                                    <option value='STOPPED'>Stopped</option>
                                </select>
                            </label>
                            <label htmlFor='ecs-definition'>
                                Expanded task definition
                                <input
                                    id='ecs-definition'
                                    onChange={event => setFilters(current => ({
                                        ...current,
                                        taskDefinition: event.target.value,
                                    }))}
                                    placeholder='family:revision'
                                    value={filters.taskDefinition}
                                />
                            </label>
                            <label className={styles.checkboxLabel} htmlFor='ecs-issues-only'>
                                <input
                                    checked={filters.issuesOnly}
                                    id='ecs-issues-only'
                                    onChange={event => setFilters(current => ({
                                        ...current,
                                        issuesOnly: event.target.checked,
                                    }))}
                                    type='checkbox'
                                />
                                Issues only
                            </label>
                        </div>
                        {visibleServices.length > 0
                            ? (
                                <StatusTable
                                    caption='Failure-first ECS services'
                                    columns={serviceColumns}
                                    expandedRow={service => (expandedServiceId === service.id
                                        ? (
                                            <ServiceTaskInventory
                                                service={service}
                                                taskDefinition={filters.taskDefinition}
                                                taskStatus={filters.taskStatus}
                                            />
                                        )
                                        : undefined)}
                                    getKey={service => `${service.clusterId}:${service.id}`}
                                    getRowLabel={getServiceRowLabel}
                                    getSeverity={service => service.severity}
                                    onRowClick={service => setExpandedServiceId(current => (
                                        current === service.id ? undefined : service.id
                                    ))}
                                    rows={visibleServices}
                                />
                            )
                            : (
                                <CompleteEmptyState>
                                    {services.length === 0
                                        ? resource.data.meta.complete
                                            ? 'The complete ECS catalog contains no services.'
                                            : 'No ECS service rows are available from the incomplete source.'
                                        : 'No services match the selected filters.'}
                                </CompleteEmptyState>
                            )}
                    </StatusPanel>
                </>
            )}
        </StatusPage>
    )
}

export default EcsStatusPage
