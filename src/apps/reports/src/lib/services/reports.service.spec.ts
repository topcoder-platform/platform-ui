/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { xhrCreateInstance, xhrGetAsync } from '~/libs/core/lib/xhr'

import {
    buildDashboardPath,
    downloadDashboardCsv,
    downloadDashboardsCsv,
    fetchDashboard,
    fetchDashboards,
} from './reports.service'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        API: { V6: 'https://api.example.com/v6' },
    },
}), { virtual: true })

jest.mock('~/libs/core/lib/xhr', () => ({
    xhrCreateInstance: jest.fn(() => ({
        get: jest.fn(),
        post: jest.fn(),
    })),
    xhrGetAsync: jest.fn(),
}), { virtual: true })

const mockedXhrGetAsync = xhrGetAsync as jest.Mock
const mockedReportsClient = (xhrCreateInstance as jest.Mock).mock.results[0].value as {
    get: jest.Mock
}

describe('reports dashboard service paths', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('builds aggregate JSON and CSV paths', () => {
        expect(buildDashboardPath())
            .toBe('/dashboard')
        expect(buildDashboardPath({}, undefined, true))
            .toBe('/dashboard/export')
    })

    it('builds detail JSON and CSV paths', () => {
        expect(buildDashboardPath({}, 'new-signups'))
            .toBe('/dashboard/new-signups')
        expect(buildDashboardPath({}, 'challenge-participation', true))
            .toBe('/dashboard/challenge-participation/export')
    })

    it('adds trimmed UTC range boundaries in stable query order', () => {
        expect(buildDashboardPath({
            endDate: ' 2026-08-01 ',
            startDate: ' 2026-02-01 ',
        }, 'members-paid'))
            .toBe('/dashboard/members-paid?startDate=2026-02-01&endDate=2026-08-01')
    })

    it('fetches aggregate and detail JSON from their authenticated reports URLs', async () => {
        mockedXhrGetAsync.mockResolvedValue({})

        await fetchDashboards({
            endDate: '2026-08-01',
            startDate: '2026-02-01',
        })
        await fetchDashboard('new-signups', {
            endDate: '2026-08-01',
            startDate: '2026-02-01',
        })

        expect(mockedXhrGetAsync)
            .toHaveBeenNthCalledWith(
                1,
                'https://api.example.com/v6/reports/dashboard?startDate=2026-02-01&endDate=2026-08-01',
                mockedReportsClient,
            )
        expect(mockedXhrGetAsync)
            .toHaveBeenNthCalledWith(
                2,
                'https://api.example.com/v6/reports/dashboard/new-signups'
                    + '?startDate=2026-02-01&endDate=2026-08-01',
                mockedReportsClient,
            )
    })

    it('requests aggregate and detail exports as CSV blobs', async () => {
        const csvBlob = new Blob(['month,count'], { type: 'text/csv' })
        mockedReportsClient.get.mockResolvedValue({ data: csvBlob })

        await expect(downloadDashboardsCsv())
            .resolves.toBe(csvBlob)
        await expect(downloadDashboardCsv('members-paid', {
            endDate: '2026-08-01',
            startDate: '2026-02-01',
        }))
            .resolves.toBe(csvBlob)

        expect(mockedReportsClient.get)
            .toHaveBeenNthCalledWith(
                1,
                'https://api.example.com/v6/reports/dashboard/export',
                {
                    headers: { Accept: 'text/csv' },
                    responseType: 'blob',
                },
            )
        expect(mockedReportsClient.get)
            .toHaveBeenNthCalledWith(
                2,
                'https://api.example.com/v6/reports/dashboard/members-paid/export'
                    + '?startDate=2026-02-01&endDate=2026-08-01',
                {
                    headers: { Accept: 'text/csv' },
                    responseType: 'blob',
                },
            )
    })
})
