/* eslint-disable ordered-imports/ordered-imports */
import { normalizeOpportunitySummary } from './opportunities.service'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        API: { V5: 'https://api.example/v5', V6: 'https://api.example/v6' },
    },
}), { virtual: true })
jest.mock('~/libs/core', () => ({
    xhrDeleteAsync: jest.fn(),
    xhrGetAsync: jest.fn(),
    xhrGlobalInstance: { get: jest.fn() },
    xhrPostAsync: jest.fn(),
}), { virtual: true })

describe('opportunities service normalization', () => {
    it('normalizes the aggregation service cells and accepted legacy aliases', () => {
        expect(normalizeOpportunitySummary({
            result: {
                content: {
                    cells: {
                        challenges: { openCount: 12, totalPrize: '38500' },
                        copilotOpportunities: { count: 2 },
                        engagements: { total: 8 },
                        reviewOpportunities: { count: 3 },
                    },
                },
            },
        }))
            .toEqual({
                competitions: { amount: 38500, count: 12 },
                copilots: { count: 2 },
                engagements: { count: 8 },
                reviews: { count: 3 },
            })
    })

    it('uses safe zero counts when aggregation cells are absent or invalid', () => {
        expect(normalizeOpportunitySummary({ competitions: { count: -1 } }))
            .toEqual({
                competitions: { count: 0 },
                copilots: { count: 0 },
                engagements: { count: 0 },
                reviews: { count: 0 },
            })
    })
})
