/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { xhrGetAsync } from '~/libs/core'

import {
    buildAnalyticsUrl,
    getAnalyticsFilters,
    getCampaignReport,
    getGeneralReport,
    requestAnalyticsReport,
} from './analytics.service'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        ANALYTICS: { API_URL: 'https://api.example.com/v1/analytics/' },
    },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    xhrGetAsync: jest.fn(),
}), { virtual: true })

const mockedXhrGetAsync = xhrGetAsync as jest.Mock

describe('Analytics API service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockedXhrGetAsync.mockResolvedValue({})
    })

    it('builds encoded URLs and omits empty filters', () => {
        expect(buildAnalyticsUrl('campaign', {
            campaign: 'launch 2026',
            from: '2026-08-01',
            source: '',
            to: '2026-08-30',
        }))
            .toBe(
                'https://api.example.com/v1/analytics/campaign'
                + '?from=2026-08-01&to=2026-08-30&campaign=launch+2026&async=true',
            )
    })

    it('loads every report through the authenticated global XHR client', async () => {
        await getAnalyticsFilters()
        await getCampaignReport({
            campaign: 'launch',
            from: '2026-08-01',
            to: '2026-08-30',
        })
        await getGeneralReport({
            from: '2026-08-01',
            surface: 'platform_ui',
            to: '2026-08-30',
        })

        expect(mockedXhrGetAsync)
            .toHaveBeenNthCalledWith(
                1,
                'https://api.example.com/v1/analytics/filters?async=true',
            )
        expect(mockedXhrGetAsync)
            .toHaveBeenNthCalledWith(
                2,
                'https://api.example.com/v1/analytics/campaign'
                + '?from=2026-08-01&to=2026-08-30&campaign=launch&async=true',
            )
        expect(mockedXhrGetAsync)
            .toHaveBeenNthCalledWith(
                3,
                'https://api.example.com/v1/analytics/general'
                + '?from=2026-08-01&to=2026-08-30&surface=platform_ui&async=true',
            )
    })

    it('polls a pending warehouse query with its server-issued token', async () => {
        const queryToken = 'a'.repeat(64)
        const report = { campaigns: [], generatedAt: '2026-09-01T00:00:00Z' }
        const wait = jest.fn()
            .mockResolvedValue(undefined)
        mockedXhrGetAsync
            .mockResolvedValueOnce({
                queryToken,
                retryAfterMs: 1_000,
                status: 'pending',
            })
            .mockResolvedValueOnce(report)

        await expect(requestAnalyticsReport('filters', {}, wait))
            .resolves.toEqual(report)
        expect(wait)
            .toHaveBeenCalledWith(1_000)
        expect(mockedXhrGetAsync)
            .toHaveBeenNthCalledWith(
                2,
                'https://api.example.com/v1/analytics/filters'
                + `?async=true&queryToken=${queryToken}`,
            )
    })

    it('bounds polling and exposes a timeout-shaped error', async () => {
        const wait = jest.fn()
            .mockResolvedValue(undefined)
        mockedXhrGetAsync.mockResolvedValue({
            queryToken: 'b'.repeat(64),
            retryAfterMs: 10_000,
            status: 'pending',
        })

        await expect(requestAnalyticsReport('filters', {}, wait))
            .rejects.toMatchObject({ response: { status: 504 } })
        expect(mockedXhrGetAsync)
            .toHaveBeenCalledTimes(12)
        expect(wait)
            .toHaveBeenCalledTimes(11)
        expect(wait)
            .toHaveBeenLastCalledWith(5_000)
    })
})
