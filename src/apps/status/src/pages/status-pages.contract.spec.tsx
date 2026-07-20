/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, sort-keys, unicorn/no-null */
import { MemoryRouter } from 'react-router-dom'
import {
    fireEvent,
    render,
    screen,
    within,
} from '@testing-library/react'

import {
    useApiEndpointStatus,
    useApiStatus,
    useDatabaseStatus,
    useEcsStatus,
    useEcsTasks,
} from '../lib/hooks'
import { ApiEndpointsPage } from './api/ApiEndpointsPage'
import { ApiStatusPage } from './api/ApiStatusPage'
import { DatabaseStatusPage } from './database/DatabaseStatusPage'
import { EcsStatusPage } from './ecs/EcsStatusPage'

jest.mock('~/config', () => ({
    AppSubdomain: { status: 'status' },
    EnvironmentConfig: { SUBDOMAIN: 'platform-ui' },
}), { virtual: true })

jest.mock('~/libs/ui', () => ({
    ContentLayout: (props: { children: React.ReactNode }): JSX.Element => <div>{props.children}</div>,
}), { virtual: true })

jest.mock('../lib/hooks', () => ({
    useApiEndpointStatus: jest.fn(),
    useApiStatus: jest.fn(),
    useDatabaseStatus: jest.fn(),
    useEcsStatus: jest.fn(),
    useEcsTaskDetail: jest.fn(),
    useEcsTasks: jest.fn(),
}))

const mockedApiEndpointStatus = useApiEndpointStatus as jest.Mock
const mockedApiStatus = useApiStatus as jest.Mock
const mockedDatabaseStatus = useDatabaseStatus as jest.Mock
const mockedEcsStatus = useEcsStatus as jest.Mock
const mockedEcsTasks = useEcsTasks as jest.Mock

const commonResource = {
    error: undefined,
    loading: false,
    refresh: jest.fn(),
    refreshing: false,
    stale: false,
}

describe('Status page live contract fixtures', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockedEcsTasks.mockReturnValue({
            ...commonResource,
            data: {
                data: { tasks: [] },
                meta: {
                    complete: true,
                    generatedAt: '2026-07-20T00:00:00.000Z',
                    source: ['ecs'],
                    warnings: [],
                },
            },
        })
    })

    it('renders nullable ECS definitions and deployments as unknown without crashing', () => {
        mockedEcsStatus.mockReturnValue({
            ...commonResource,
            data: {
                data: {
                    clusters: [{
                        id: 'infrastructure',
                        name: 'topcoder-infrastructure',
                        pendingTasks: null,
                        registeredContainerInstances: null,
                        runningTasks: null,
                        services: [{
                            clusterId: 'infrastructure',
                            dataComplete: false,
                            deploymentCounts: { last24Hours: 0, last7Days: 0 },
                            desiredCount: null,
                            id: 'missing-service',
                            latestDeployment: null,
                            latestFailure: null,
                            name: 'Missing service',
                            pendingCount: null,
                            recentStoppedCount: null,
                            runningCount: null,
                            severity: 'healthy-change',
                            severityReasons: ['Recently changed'],
                            stoppedHistoryComplete: false,
                            taskDefinition: null,
                        }],
                        severity: 'healthy-change',
                        status: 'ACTIVE',
                    }],
                },
                meta: {
                    complete: false,
                    generatedAt: '2026-07-20T00:00:00.000Z',
                    source: ['ecs'],
                    warnings: [{ code: 'CATALOG_STALE', message: 'Catalog entry is stale' }],
                },
            },
        })

        render(<EcsStatusPage />)

        expect(screen.getAllByText('Missing service').length)
            .toBeGreaterThan(0)
        expect(screen.getAllByText('Unknown task definition').length)
            .toBeGreaterThan(0)
        expect(screen.getAllByText('No deployment available').length)
            .toBeGreaterThan(0)
        expect(screen.getAllByText('Failure history incomplete').length)
            .toBeGreaterThan(0)
        expect(screen.queryByText('No recent failure'))
            .toBeNull()
        expect(screen.getAllByLabelText('Status: Healthy · recent change').length)
            .toBeGreaterThan(0)
    })

    it('keeps a service visible while filtering its expanded inventory by an older revision', () => {
        mockedEcsStatus.mockReturnValue({
            ...commonResource,
            data: {
                data: {
                    clusters: [{
                        id: 'infrastructure',
                        name: 'topcoder-infrastructure',
                        pendingTasks: 0,
                        registeredContainerInstances: 0,
                        runningTasks: 1,
                        services: [{
                            clusterId: 'infrastructure',
                            dataComplete: true,
                            deploymentCounts: { last24Hours: 1, last7Days: 2 },
                            desiredCount: 1,
                            id: 'rolling-service',
                            latestDeployment: null,
                            latestFailure: null,
                            name: 'Rolling service',
                            pendingCount: 0,
                            recentStoppedCount: 1,
                            runningCount: 1,
                            severity: 'healthy-change',
                            severityReasons: ['Recently changed'],
                            stoppedHistoryComplete: true,
                            taskDefinition: {
                                family: 'rolling-service',
                                revision: 42,
                                url: null,
                            },
                        }],
                        severity: 'healthy-change',
                        status: 'ACTIVE',
                    }],
                },
                meta: {
                    complete: true,
                    generatedAt: '2026-07-20T00:00:00.000Z',
                    source: ['ecs'],
                    warnings: [],
                },
            },
        })

        render(<EcsStatusPage />)

        fireEvent.click(screen.getAllByRole('button', { name: 'View tasks' })[0])
        fireEvent.change(screen.getByLabelText('Expanded task definition'), {
            target: { value: 'rolling-service:41' },
        })

        expect(screen.getAllByText('Rolling service').length)
            .toBeGreaterThan(0)
        expect(screen.getByText('Task inventory for Rolling service'))
            .toBeTruthy()
        const latestTaskQuery = mockedEcsTasks.mock.calls[mockedEcsTasks.mock.calls.length - 1][0]
        expect(latestTaskQuery)
            .toEqual(expect.objectContaining({ taskDefinition: 'rolling-service:41' }))
    })

    it('renders incomplete API aggregates as unknown instead of fallback counts', () => {
        mockedApiStatus.mockReturnValue({
            ...commonResource,
            data: {
                data: {
                    services: [{
                        dataComplete: false,
                        id: 'gateway',
                        latencyMs: {
                            integration: { p50: 11, p95: 22, p99: 33 },
                            response: { p50: 44, p95: 55, p99: 66 },
                        },
                        name: 'Gateway',
                        requests: 987654,
                        responseCounts: {
                            clientError: 123,
                            redirect: 234,
                            serverError: 345,
                            success: 456,
                        },
                        responseRatios: {
                            clientError: 0.1,
                            redirect: 0.2,
                            serverError: 0.3,
                            success: 0.4,
                        },
                        targetHealth: { healthy: 0, unhealthy: 0, unknown: true },
                    }],
                    summary: {
                        dataComplete: false,
                        healthyTargets: 0,
                        latencyMs: {
                            integration: { p50: 11, p95: 22, p99: 33 },
                            response: { p50: 44, p95: 55, p99: 66 },
                        },
                        requests: 876543,
                        responseCounts: {
                            clientError: 123,
                            redirect: 234,
                            serverError: 345,
                            success: 456,
                        },
                        responseRatios: {
                            clientError: 0.1,
                            redirect: 0.2,
                            serverError: 0.3,
                            success: 0.4,
                        },
                        unhealthyTargets: 0,
                    },
                },
                meta: {
                    complete: false,
                    generatedAt: '2026-07-20T00:00:00.000Z',
                    source: ['cloudwatch-logs'],
                    warnings: [{
                        code: 'QUERY_TIMEOUT',
                        message: 'The aggregate query timed out',
                    }],
                    window: '1h',
                },
            },
        })

        render(
            <MemoryRouter>
                <ApiStatusPage />
            </MemoryRouter>,
        )

        const totalRequestsCard = screen.getByText('Total requests')
            .closest('article') as HTMLElement
        expect(within(totalRequestsCard)
            .getByText('—'))
            .toBeTruthy()
        expect(screen.queryByText('876,543'))
            .toBeNull()
        expect(screen.queryByText('987,654'))
            .toBeNull()
        expect(screen.getAllByText('Incomplete').length)
            .toBeGreaterThan(0)
    })

    it('renders incomplete endpoint aggregates and coverage as unknown', () => {
        mockedApiEndpointStatus.mockReturnValue({
            ...commonResource,
            data: {
                data: {
                    coverage: {
                        attributedRequests: 876543,
                        unattributedEdgeFailures: 765432,
                    },
                    endpoints: [{
                        dataComplete: false,
                        id: 'get-resource',
                        latencyMs: {
                            integration: { p50: 11, p95: 22, p99: 33 },
                            response: { p50: 44, p95: 55, p99: 66 },
                        },
                        method: 'GET',
                        requests: 987654,
                        responseCounts: {
                            clientError: 123,
                            redirect: 234,
                            serverError: 345,
                            success: 456,
                        },
                        responseRatios: {
                            clientError: 0.1,
                            redirect: 0.2,
                            serverError: 0.3,
                            success: 0.4,
                        },
                        routeTemplate: '/resources/:resourceId',
                    }],
                    service: { id: 'resources', name: 'Resources API' },
                },
                meta: {
                    complete: false,
                    generatedAt: '2026-07-20T00:00:00.000Z',
                    source: ['cloudwatch-logs'],
                    warnings: [{
                        code: 'QUERY_INCOMPLETE',
                        message: 'The endpoint query was incomplete',
                    }],
                    window: '1h',
                },
            },
        })

        render(
            <MemoryRouter>
                <ApiEndpointsPage />
            </MemoryRouter>,
        )

        expect(screen.queryByText('987,654'))
            .toBeNull()
        expect(screen.queryByText('876,543'))
            .toBeNull()
        expect(screen.queryByText('765,432'))
            .toBeNull()
        expect(screen.getAllByText('—').length)
            .toBeGreaterThan(0)
    })

    it('renders exact RDS event and console fields plus derived incomplete states', () => {
        mockedDatabaseStatus.mockReturnValue({
            ...commonResource,
            data: {
                data: {
                    database: {
                        connections: {
                            average: 10,
                            latest: 8,
                            maximum: 15,
                            sampledAt: '2026-07-20T00:00:00.000Z',
                        },
                        consoleUrl: 'https://us-east-1.console.aws.amazon.com/rds/home',
                        engine: 'postgres',
                        engineMessages: [],
                        events: [{
                            categories: ['availability'],
                            sourceType: 'db-instance',
                            summary: 'Instance restarted safely',
                            timestamp: '2026-07-20T00:00:00.000Z',
                        }],
                        id: 'topcoder-services',
                        status: 'available',
                        storage: {
                            allocatedBytes: 1000,
                            freeBytes: 400,
                            meaning: 'rds_allocation_usage',
                            sampledAt: '2026-07-20T00:00:00.000Z',
                            usedBytes: 600,
                            usedRatio: 0.6,
                        },
                    },
                },
                meta: {
                    complete: false,
                    generatedAt: '2026-07-20T00:00:00.000Z',
                    source: ['rds', 'cloudwatch-metrics'],
                    warnings: [{
                        code: 'RDS_ENGINE_TELEMETRY_UNAVAILABLE',
                        message: 'Engine telemetry is unavailable',
                    }, {
                        code: 'DATABASE_SIZE_INTERPRETATION_PENDING',
                        message: 'Logical database size is not approved',
                    }],
                    window: '1h',
                },
            },
        })

        render(<DatabaseStatusPage />)

        expect(screen.getByText('Instance restarted safely'))
            .toBeTruthy()
        expect(screen.getByText('availability'))
            .toBeTruthy()
        expect(screen.getByText(/Engine-log coverage is incomplete/))
            .toBeTruthy()
        expect(screen.getByText('Incomplete', { selector: 'div' }))
            .toBeTruthy()
        expect(screen.getByRole('link', { name: /Open RDS in AWS/ })
            .getAttribute('href'))
            .toContain('console.aws.amazon.com')
    })
})
