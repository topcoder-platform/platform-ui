/**
 * Route-scoped Status data hooks. Each hook is disabled until all identifiers
 * required by its active view are available.
 */
import { useCallback } from 'react'

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
    StatusWindow,
} from '../models'
import {
    EcsTaskQuery,
    getApiEndpoints,
    getApiFailures,
    getApiServices,
    getDatabaseSummary,
    getEcsClusters,
    getEcsService,
    getEcsTask,
    getEcsTasks,
    getSendgridMessages,
    getSendgridSummary,
} from '../services'

import { StatusResourceState, useStatusResource } from './useStatusResource'

/**
 * Loads ECS cluster/service summaries for the active ECS tab.
 *
 * @returns request lifecycle state for the ECS overview envelope.
 * @throws Does not throw; failures are exposed through the returned state.
 */
export function useEcsStatus(): StatusResourceState<StatusEnvelope<EcsClustersData>> {
    return useStatusResource('ecs:clusters', getEcsClusters)
}

/**
 * Loads one task page only while a service inventory is expanded.
 *
 * @param query allowlisted service, task, and cursor filters.
 * @param enabled whether the expanded inventory may issue a request.
 * @returns request lifecycle state for one ECS task page.
 * @throws Does not throw; failures are exposed through the returned state.
 */
export function useEcsTasks(
    query: EcsTaskQuery,
    enabled: boolean,
): StatusResourceState<StatusEnvelope<EcsTasksData>> {
    const key = enabled && query.serviceId && query.clusterId
        ? `ecs:tasks:${JSON.stringify(query)}`
        : undefined
    const request = useCallback(() => getEcsTasks(query), [query])
    return useStatusResource(key, request)
}

/**
 * Loads current details for a selected service when its ID is available.
 *
 * @param serviceId server-issued opaque service identifier, or undefined to disable.
 * @returns request lifecycle state for the selected service.
 * @throws Does not throw; failures are exposed through the returned state.
 */
export function useEcsService(
    serviceId?: string,
): StatusResourceState<StatusEnvelope<EcsServiceData>> {
    const request = useCallback(() => getEcsService(serviceId as string), [serviceId])
    return useStatusResource(serviceId ? `ecs:service:${serviceId}` : undefined, request)
}

/**
 * Loads sanitized stopped-task details when a task ID is available.
 *
 * @param taskId server-issued opaque task identifier, or undefined to disable.
 * @returns request lifecycle state for the selected task.
 * @throws Does not throw; failures are exposed through the returned state.
 */
export function useEcsTaskDetail(
    taskId?: string,
): StatusResourceState<StatusEnvelope<EcsTaskData>> {
    const request = useCallback(() => getEcsTask(taskId as string), [taskId])
    return useStatusResource(taskId ? `ecs:task:${taskId}` : undefined, request)
}

/**
 * Loads API service aggregates for the selected supported window.
 *
 * @param window supported API aggregation window.
 * @returns request lifecycle state for the API overview.
 * @throws Does not throw; failures are exposed through the returned state.
 */
export function useApiStatus(
    window: StatusWindow,
): StatusResourceState<StatusEnvelope<ApiServicesData>> {
    const request = useCallback(() => getApiServices(window), [window])
    return useStatusResource(`api:services:${window}`, request)
}

/**
 * Loads endpoint aggregates after the routed service ID is available.
 *
 * @param serviceId routed opaque service identifier, or undefined to disable.
 * @param window supported endpoint aggregation window.
 * @returns request lifecycle state for the endpoint drilldown.
 * @throws Does not throw; failures are exposed through the returned state.
 */
export function useApiEndpointStatus(
    serviceId: string | undefined,
    window: StatusWindow,
): StatusResourceState<StatusEnvelope<ApiEndpointsData>> {
    const request = useCallback(
        () => getApiEndpoints(serviceId as string, window),
        [serviceId, window],
    )
    const key = serviceId ? `api:endpoints:${serviceId}:${window}` : undefined
    return useStatusResource(key, request)
}

/**
 * Loads bounded safe failures after both routed identifiers are available.
 *
 * @param serviceId routed opaque service identifier, or undefined to disable.
 * @param endpointId routed opaque endpoint identifier, or undefined to disable.
 * @param window supported failure aggregation window.
 * @returns request lifecycle state for the failure drilldown.
 * @throws Does not throw; failures are exposed through the returned state.
 */
export function useApiFailures(
    serviceId: string | undefined,
    endpointId: string | undefined,
    window: StatusWindow,
): StatusResourceState<StatusEnvelope<ApiFailuresData>> {
    const request = useCallback(
        () => getApiFailures(serviceId as string, endpointId as string, window),
        [endpointId, serviceId, window],
    )
    const key = serviceId && endpointId
        ? `api:failures:${serviceId}:${endpointId}:${window}`
        : undefined
    return useStatusResource(key, request)
}

/**
 * Loads exact rolling SendGrid acceptance aggregates for the active tab.
 *
 * @returns request lifecycle state for all six fixed SendGrid windows.
 * @throws Does not throw; failures are exposed through the returned state.
 */
export function useSendgridStatus(): StatusResourceState<StatusEnvelope<SendgridSummaryData>> {
    return useStatusResource('sendgrid:summary', getSendgridSummary)
}

/**
 * Loads the server-bounded first provider activity page only while its disclosure is open.
 *
 * @param enabled whether the activity disclosure is open and the request may run.
 * @returns resource state containing up to 50 sanitized provider records.
 * @throws Does not throw; failures are exposed through the returned state.
 */
export function useSendgridMessages(
    enabled: boolean,
): StatusResourceState<StatusEnvelope<SendgridMessagesData>> {
    const request = useCallback(() => getSendgridMessages(), [])
    const key = enabled ? 'sendgrid:messages:first' : undefined
    return useStatusResource(key, request)
}

/**
 * Loads database telemetry for the selected supported window.
 *
 * @param window supported database telemetry and event window.
 * @returns request lifecycle state for the database overview.
 * @throws Does not throw; failures are exposed through the returned state.
 */
export function useDatabaseStatus(
    window: StatusWindow,
): StatusResourceState<StatusEnvelope<DatabaseSummaryData>> {
    const request = useCallback(() => getDatabaseSummary(window), [window])
    return useStatusResource(`database:summary:${window}`, request)
}
