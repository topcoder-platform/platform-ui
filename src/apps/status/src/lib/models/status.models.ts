/**
 * Wire models returned by status-api-v6. Values remain nullable where a source
 * cannot prove a metric so the UI never turns missing telemetry into zero.
 */

export type StatusWindow = '15m' | '1h' | '3h' | '6h' | '12h' | '24h' | '7d'
export type StatusSeverity = 'critical' | 'warning' | 'healthy-change' | 'healthy' | 'unknown'

export interface StatusWarning {
    code: string
    message: string
    source?: string
}

export interface StatusMeta {
    generatedAt: string
    source: string[]
    window?: StatusWindow
    complete: boolean
    warnings: StatusWarning[]
}

export interface StatusEnvelope<T> {
    data: T
    meta: StatusMeta
}

export interface StatusErrorPayload {
    code?: string
    message?: string
    timestamp?: string
    requestId?: string
}

export interface StatusRequestError {
    kind: 'authorization' | 'timeout' | 'throttled' | 'general'
    message: string
    status?: number
}

export interface AwsLinkValue {
    family: string
    revision: number
    url?: string | null
}

export interface EcsDeploymentSummary {
    status: string
    startedAt?: string | null
    finishedAt?: string | null
    reason?: string | null
}

export interface GenericExitInterpretation {
    kind: 'generic'
    summary: string
}

export interface EcsFailureSummary {
    taskId?: string
    timestamp?: string | null
    reason?: string | null
    stoppedAt?: string | null
    stopCode?: string | null
    stoppedReason?: string | null
    containerName?: string | null
    exitCode?: number | null
    exitInterpretation?: GenericExitInterpretation | string | null
    cloudWatchUrl?: string | null
}

export interface EcsServiceSummary {
    id: string
    name: string
    clusterId: string
    clusterName?: string
    desiredCount: number | null
    runningCount: number | null
    pendingCount: number | null
    recentStoppedCount: number | null
    stoppedHistoryComplete: boolean
    taskDefinition: AwsLinkValue | null
    latestDeployment: EcsDeploymentSummary | null
    deploymentCounts: {
        last24Hours: number
        last7Days: number
    }
    latestFailure?: EcsFailureSummary | null
    severity: StatusSeverity
    severityReasons: string[]
    dataComplete: boolean
}

export interface EcsClusterSummary {
    id: string
    name: string
    status: string
    registeredContainerInstances: number | null
    runningTasks: number | null
    pendingTasks: number | null
    services: EcsServiceSummary[]
    severity: StatusSeverity
}

export interface EcsClustersData {
    clusters: EcsClusterSummary[]
}

export interface EcsContainerStatus {
    name: string
    lastStatus: string
    healthStatus?: string | null
    reason?: string | null
    exitCode?: number | null
    exitInterpretation?: GenericExitInterpretation | string | null
}

export interface EcsTaskSummary {
    id: string
    opaqueTaskId?: string
    clusterId: string
    serviceId: string | null
    lastStatus: string
    desiredStatus?: string | null
    healthStatus?: string | null
    startedAt?: string | null
    launchedAt?: string | null
    stoppedAt?: string | null
    stopCode?: string | null
    stoppedReason?: string | null
    launchType?: string | null
    availabilityZone?: string | null
    deploymentId?: string | null
    taskDefinition: AwsLinkValue | null
    taskUrl?: string | null
    containers: EcsContainerStatus[]
    cloudWatchUrl?: string | null
    severity: StatusSeverity
    severityReasons: string[]
    dataComplete: boolean
}

export interface EcsTasksData {
    tasks: EcsTaskSummary[]
    nextCursor?: string | null
}

export interface EcsServiceData {
    service: EcsServiceSummary
}

export interface EcsTaskData {
    task: EcsTaskSummary
}

export interface ResponseClasses<T> {
    success: T
    redirect: T
    clientError: T
    serverError: T
}

export interface LatencyPercentiles {
    p50: number | null
    p95: number | null
    p99: number | null
}

export interface ApiLatency {
    response: LatencyPercentiles
    integration: LatencyPercentiles
}

export interface ApiTargetHealth {
    healthy: number | null
    unhealthy: number | null
    unknown?: boolean | number | null
}

export interface ApiServiceSummary {
    id: string
    name: string
    requests: number
    responseCounts: ResponseClasses<number>
    responseRatios: ResponseClasses<number | null>
    latencyMs: ApiLatency
    targetHealth: ApiTargetHealth
    dataComplete: boolean
}

export interface ApiServicesData {
    services: ApiServiceSummary[]
    summary?: {
        requests: number
        responseCounts: ResponseClasses<number>
        responseRatios: ResponseClasses<number | null>
        latencyMs: ApiLatency
        healthyTargets: number | null
        unhealthyTargets: number | null
        dataComplete: boolean
    }
}

export interface ApiEndpointSummary {
    id: string
    method: string
    routeTemplate: string
    requests: number
    responseCounts: ResponseClasses<number>
    responseRatios: ResponseClasses<number | null>
    latencyMs: ApiLatency
    recentFailureCount?: number
    dataComplete: boolean
}

export interface ApiEndpointsData {
    service: Pick<ApiServiceSummary, 'id' | 'name'>
    endpoints: ApiEndpointSummary[]
    coverage: {
        attributedRequests: number
        unattributedEdgeFailures: number
        complete?: boolean
    }
}

export interface ApiFailureRecord {
    timestamp: string
    requestId: string
    method: string
    routeTemplate: string
    statusCode: number
    responseClass: string
    errorCode?: string | null
    errorType?: string | null
    errorSummary?: string | null
    responseLatencyMs?: number | null
    integrationLatencyMs?: number | null
    cloudWatchUrl?: string | null
}

export interface ApiFailuresData {
    service: Pick<ApiServiceSummary, 'id' | 'name'>
    endpoint: Pick<ApiEndpointSummary, 'id' | 'method' | 'routeTemplate'>
    failures: ApiFailureRecord[]
}

export interface SendgridWindowSummary {
    window: Exclude<StatusWindow, '7d'>
    acceptedMessages: number | null
    failedMessages: number | null
    acceptedOperations: number | null
    failedOperations: number | null
    successRatio: number | null
    failureRatio: number | null
    lastTerminalSendAt: string | null
}

export interface SendgridSummaryData {
    semantics: 'sendgrid_api_acceptance'
    windows: SendgridWindowSummary[]
}

export interface SendgridMessage {
    id: string
    timestamp: string | null
    status: string
    toMasked: string | null
}

export interface SendgridMessagesData {
    messages: SendgridMessage[]
}

export interface DatabaseStorage {
    meaning?: 'rds_allocation_usage'
    allocatedBytes: number | null
    freeBytes: number | null
    usedBytes: number | null
    usedRatio: number | null
    maxAllocatedBytes?: number | null
    logicalSizeBytes?: number | null
    logicalSizeComplete?: boolean
    sampledAt?: string | null
}

export interface DatabaseConnections {
    latest: number | null
    average: number | null
    maximum: number | null
    sampledAt?: string | null
}

export interface DatabaseEvent {
    id?: string
    timestamp: string | null
    category?: string | null
    categories?: string[]
    message?: string
    summary?: string
    sourceType?: string | null
    sourceIdentifier?: string | null
}

export interface DatabaseEngineMessage {
    id?: string
    timestamp: string | null
    severity: string
    summary: string
    cloudWatchUrl?: string | null
}

export interface DatabaseSummary {
    id: string
    engine?: string
    engineVersion?: string | null
    status: string
    storage: DatabaseStorage
    connections: DatabaseConnections
    events: DatabaseEvent[]
    engineMessages: DatabaseEngineMessage[]
    awsUrl?: string | null
    consoleUrl?: string | null
    logicalSizeComplete?: boolean
    engineLogsComplete?: boolean
}

export interface DatabaseSummaryData {
    database: DatabaseSummary | null
}
