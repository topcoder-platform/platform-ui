/* eslint-disable import/no-extraneous-dependencies */
import {
    analyticsRequestKey,
    defaultAnalyticsDateRange,
    formatAnalyticsFreshness,
    formatAnalyticsInteger,
    formatAnalyticsPercent,
    formatAnalyticsSurface,
    validateAnalyticsDateRange,
} from './analytics.utils'

describe('Analytics utilities', () => {
    it('creates a deterministic inclusive 30-day UTC default', () => {
        expect(defaultAnalyticsDateRange(new Date('2026-08-30T23:59:59Z')))
            .toEqual({ from: '2026-08-01', to: '2026-08-30' })
    })

    it('validates strict, ordered, bounded date ranges', () => {
        const reference = new Date('2026-08-30T23:59:59Z')

        expect(validateAnalyticsDateRange(
            { from: '2026-02-30', to: '2026-03-01' },
            reference,
        ))
            .toBe('Choose a valid start and end date.')
        expect(validateAnalyticsDateRange(
            { from: '2026-08-31', to: '2026-08-30' },
            reference,
        ))
            .toBe('The start date must not be after the end date.')
        expect(validateAnalyticsDateRange(
            { from: '2026-08-30', to: '2026-08-31' },
            reference,
        ))
            .toBe('The end date must not be in the future.')
        expect(validateAnalyticsDateRange(
            { from: '2025-08-29', to: '2026-08-30' },
            reference,
        ))
            .toBe('Analytics date ranges cannot exceed 366 days.')
        expect(validateAnalyticsDateRange(
            { from: '2025-08-30', to: '2026-08-30' },
            reference,
        ))
            .toBeUndefined()
    })

    it('formats aggregate values and safe dimensions', () => {
        expect(formatAnalyticsInteger(12345))
            .toBe('12,345')
        expect(formatAnalyticsPercent(12.345))
            .toBe('12.35%')
        expect(formatAnalyticsSurface('topcoder_website'))
            .toBe('Topcoder Website')
        expect(formatAnalyticsFreshness('2026-08-30'))
            .toBe('Aug 30, 2026')
        expect(formatAnalyticsFreshness('not-a-date'))
            .toBe('not-a-date')
    })

    it('creates a stable key regardless of filter property insertion order', () => {
        expect(analyticsRequestKey('campaign', {
            from: '2026-08-01',
            to: '2026-08-30',
        }))
            .toBe('campaign:from=2026-08-01&to=2026-08-30')
    })
})
