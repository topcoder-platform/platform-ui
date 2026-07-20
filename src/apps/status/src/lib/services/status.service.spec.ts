/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { xhrGetAsync } from '~/libs/core'

import {
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
    STATUS_API_BASE,
} from './status.service'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        API: {
            V6: 'https://api.example.test/v6',
        },
    },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    xhrGetAsync: jest.fn()
        .mockResolvedValue({ data: {}, meta: {} }),
}), { virtual: true })

const mockedGet = xhrGetAsync as jest.Mock

describe('Status API service', () => {
    beforeEach(() => {
        mockedGet.mockClear()
    })

    it('uses the shared v6 status base and GET helper for every provider route', async () => {
        await getEcsClusters()
        await getEcsService('service/id')
        await getEcsTask('task/id')
        await getApiServices('1h')
        await getApiEndpoints('api/id', '3h')
        await getApiFailures('api/id', 'endpoint/id', '15m')
        await getSendgridSummary()
        await getSendgridMessages()
        await getDatabaseSummary('24h')

        expect(STATUS_API_BASE)
            .toBe('https://api.example.test/v6/status')
        expect(mockedGet.mock.calls.map(call => call[0]))
            .toEqual([
                `${STATUS_API_BASE}/ecs/clusters`,
                `${STATUS_API_BASE}/ecs/services/service%2Fid`,
                `${STATUS_API_BASE}/ecs/tasks/task%2Fid`,
                `${STATUS_API_BASE}/api/services?window=1h`,
                `${STATUS_API_BASE}/api/services/api%2Fid/endpoints?window=3h`,
                `${STATUS_API_BASE}/api/services/api%2Fid/endpoints/endpoint%2Fid/failures?limit=50&window=15m`,
                `${STATUS_API_BASE}/sendgrid/summary`,
                `${STATUS_API_BASE}/sendgrid/messages?window=1h`,
                `${STATUS_API_BASE}/database/summary?window=24h`,
            ])
    })

    it('encodes only allowlisted ECS task filters', async () => {
        await getEcsTasks({
            clusterId: 'cluster one',
            cursor: 'next/token',
            limit: 50,
            serviceId: 'service-one',
            severity: 'critical',
            status: 'STOPPED',
            taskDefinition: 'email:42',
        })

        const requestedUrl: string = mockedGet.mock.calls[0][0]
        expect(requestedUrl)
            .toContain(`${STATUS_API_BASE}/ecs/tasks?`)
        expect(requestedUrl)
            .toContain('clusterId=cluster+one')
        expect(requestedUrl)
            .toContain('cursor=next%2Ftoken')
        expect(requestedUrl)
            .toContain('serviceId=service-one')
        expect(requestedUrl)
            .toContain('status=STOPPED')
        expect(requestedUrl)
            .toContain('taskDefinition=email%3A42')
        expect(requestedUrl).not.toContain('arn=')
        expect(requestedUrl).not.toContain('logGroup=')
    })
})
