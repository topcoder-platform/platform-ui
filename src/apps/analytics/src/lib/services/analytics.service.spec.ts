/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { xhrGetAsync } from '~/libs/core'

import {
    buildAnalyticsUrl,
    getAnalyticsFilters,
    getCampaignReport,
    getGeneralReport,
} from './analytics.service'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        ANALYTICS: { API_URL: 'https://analytics-api.example.com/v1/analytics/' },
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
                'https://analytics-api.example.com/v1/analytics/campaign'
                + '?from=2026-08-01&to=2026-08-30&campaign=launch+2026',
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
                'https://analytics-api.example.com/v1/analytics/filters',
            )
        expect(mockedXhrGetAsync)
            .toHaveBeenNthCalledWith(
                2,
                'https://analytics-api.example.com/v1/analytics/campaign'
                + '?from=2026-08-01&to=2026-08-30&campaign=launch',
            )
        expect(mockedXhrGetAsync)
            .toHaveBeenNthCalledWith(
                3,
                'https://analytics-api.example.com/v1/analytics/general'
                + '?from=2026-08-01&to=2026-08-30&surface=platform_ui',
            )
    })
})
