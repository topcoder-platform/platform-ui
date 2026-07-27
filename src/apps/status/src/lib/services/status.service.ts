/**
 * Read-only HTTP client for status-api-v6.
 */
import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

import {
    ApiEndpointsData,
    ApiFailuresData,
    ApiServicesData,
    DatabaseSummaryData,
    EcsClustersData,
    EcsServiceData,
    EcsTaskData,
    EcsTasksData,
    SendgridMessagesData,
    SendgridSummaryData,
    StatusEnvelope,
    StatusSeverity,
    StatusWindow,
} from '../models'

export const STATUS_API_BASE = `${EnvironmentConfig.API.V6}/status`

export interface EcsTaskQuery {
    clusterId?: string
    serviceId?: string
    status?: string
    severity?: StatusSeverity
    taskDefinition?: string
    cursor?: string
    limit?: number
}

/**
 * Appends allowlisted query parameters to a Status API path.
 *
 * @param path server-owned route path.
 * @param values allowlisted scalar query values.
 * @returns absolute Status API URL with encoded values.
 * @throws Does not throw.
 */
function withQuery(
    path: string,
    values: Record<string, string | number | undefined>,
): string {
    const params = new URLSearchParams()
    Object.entries(values)
        .forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                params.set(key, String(value))
            }
        })
    const query = params.toString()
    return `${STATUS_API_BASE}${path}${query ? `?${query}` : ''}`
}

/**
 * Encodes an opaque server-issued identifier as one URL segment.
 *
 * @param value opaque resource identifier.
 * @returns safely encoded path segment.
 * @throws Does not throw.
 */
function resourceId(value: string): string {
    return encodeURIComponent(value)
}

/**
 * Fetches failure-first ECS cluster and service summaries for the ECS overview.
 *
 * @returns the catalogued cluster and service response envelope.
 * @throws Does not throw synchronously; the returned promise rejects when the GET fails.
 */
export function getEcsClusters(): Promise<StatusEnvelope<EcsClustersData>> {
    return xhrGetAsync(`${STATUS_API_BASE}/ecs/clusters`)
}

/**
 * Fetches a bounded page of ECS tasks using only supported filters.
 *
 * @param query allowlisted task filters and cursor.
 * @returns the task page response.
 * @throws Does not throw synchronously; the returned promise rejects when the GET fails.
 */
export function getEcsTasks(query: EcsTaskQuery): Promise<StatusEnvelope<EcsTasksData>> {
    return xhrGetAsync(withQuery('/ecs/tasks', {
        clusterId: query.clusterId,
        cursor: query.cursor,
        limit: query.limit,
        serviceId: query.serviceId,
        severity: query.severity,
        status: query.status,
        taskDefinition: query.taskDefinition,
    }))
}

/**
 * Fetches one catalogued ECS service for an expanded service view.
 *
 * @param serviceId server-issued opaque service identifier.
 * @returns the matching service response envelope.
 * @throws Does not throw synchronously; the returned promise rejects when the GET fails.
 */
export function getEcsService(serviceId: string): Promise<StatusEnvelope<EcsServiceData>> {
    return xhrGetAsync(`${STATUS_API_BASE}/ecs/services/${resourceId(serviceId)}`)
}

/**
 * Fetches one catalogued ECS task for the task failure drilldown.
 *
 * @param taskId server-issued opaque task identifier.
 * @returns the matching sanitized task response envelope.
 * @throws Does not throw synchronously; the returned promise rejects when the GET fails.
 */
export function getEcsTask(taskId: string): Promise<StatusEnvelope<EcsTaskData>> {
    return xhrGetAsync(`${STATUS_API_BASE}/ecs/tasks/${resourceId(taskId)}`)
}

/**
 * Fetches Gateway and ALB service aggregates for the API overview.
 *
 * @param window supported aggregate time window.
 * @returns API service aggregates and global summary metadata.
 * @throws Does not throw synchronously; the returned promise rejects when the GET fails.
 */
export function getApiServices(window: StatusWindow): Promise<StatusEnvelope<ApiServicesData>> {
    return xhrGetAsync(withQuery('/api/services', { window }))
}

/**
 * Fetches safe route-template aggregates for one API service drilldown.
 *
 * @param serviceId server-issued opaque API service identifier.
 * @param window supported aggregate time window.
 * @returns endpoint aggregate response envelope.
 * @throws Does not throw synchronously; the returned promise rejects when the GET fails.
 */
export function getApiEndpoints(
    serviceId: string,
    window: StatusWindow,
): Promise<StatusEnvelope<ApiEndpointsData>> {
    return xhrGetAsync(withQuery(`/api/services/${resourceId(serviceId)}/endpoints`, { window }))
}

/**
 * Fetches at most 50 sanitized failures for an endpoint drilldown.
 *
 * @param serviceId server-issued opaque API service identifier.
 * @param endpointId server-issued opaque endpoint identifier.
 * @param window supported failure time window.
 * @returns bounded endpoint failure response envelope.
 * @throws Does not throw synchronously; the returned promise rejects when the GET fails.
 */
export function getApiFailures(
    serviceId: string,
    endpointId: string,
    window: StatusWindow,
): Promise<StatusEnvelope<ApiFailuresData>> {
    const path = `/api/services/${resourceId(serviceId)}`
        + `/endpoints/${resourceId(endpointId)}/failures`
    return xhrGetAsync(withQuery(path, { limit: 50, window }))
}

/**
 * Fetches all six fixed SendGrid acceptance windows for the SendGrid overview.
 *
 * @returns recipient-weighted logical-send acceptance aggregates.
 * @throws Does not throw synchronously; the returned promise rejects when the GET fails.
 */
export function getSendgridSummary(): Promise<StatusEnvelope<SendgridSummaryData>> {
    return xhrGetAsync(`${STATUS_API_BASE}/sendgrid/summary`)
}

/**
 * Fetches the server-bounded first 50 sanitized provider activity records for the last hour.
 *
 * @returns the provider activity envelope; the promise rejects when the read request fails.
 * @throws Does not throw synchronously; the returned promise rejects when the GET fails.
 */
export function getSendgridMessages(): Promise<StatusEnvelope<SendgridMessagesData>> {
    return xhrGetAsync(withQuery('/sendgrid/messages', { window: '1h' }))
}

/**
 * Fetches RDS storage, connection, event, and engine-log status for the database page.
 *
 * @param window supported telemetry and event time window.
 * @returns database telemetry response envelope.
 * @throws Does not throw synchronously; the returned promise rejects when the GET fails.
 */
export function getDatabaseSummary(
    window: StatusWindow,
): Promise<StatusEnvelope<DatabaseSummaryData>> {
    return xhrGetAsync(withQuery('/database/summary', { window }))
}
