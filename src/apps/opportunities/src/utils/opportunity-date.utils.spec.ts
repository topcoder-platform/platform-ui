import {
    formatOpportunityDate,
    formatOpportunityDateRange,
    formatOpportunityDateTime,
} from './opportunity-date.utils'

describe('opportunity-date.utils', () => {
    describe('formatOpportunityDate', () => {
        it('abbreviates the month and drops the comma before the year', () => {
            expect(formatOpportunityDate('2026-09-17T14:39:00', 'TBD'))
                .toBe('17 Sep 2026')
        })

        it('returns the fallback for absent and malformed values', () => {
            expect(formatOpportunityDate(undefined, 'TBD'))
                .toBe('TBD')
            expect(formatOpportunityDate('not-a-date', 'TBD'))
                .toBe('TBD')
        })
    })

    describe('formatOpportunityDateTime', () => {
        it('appends a zero-padded 24-hour local time', () => {
            expect(formatOpportunityDateTime('2026-09-17T14:39:00', '—'))
                .toBe('17 Sep 2026, 14:39')
            expect(formatOpportunityDateTime('2026-06-12T09:35:00', '—'))
                .toBe('12 Jun 2026, 09:35')
        })

        it('renders midnight as 00', () => {
            expect(formatOpportunityDateTime('2026-09-17T00:05:00', '—'))
                .toBe('17 Sep 2026, 00:05')
        })

        it('returns the fallback for absent and malformed values', () => {
            expect(formatOpportunityDateTime(undefined, '—'))
                .toBe('—')
            expect(formatOpportunityDateTime('not-a-date', '—'))
                .toBe('—')
        })
    })

    describe('formatOpportunityDateRange', () => {
        it('states the year once when both ends share it', () => {
            expect(formatOpportunityDateRange('2026-09-14T09:55:00', '2026-09-15T15:39:00', 'TBD'))
                .toBe('14 Sep - 15 Sep 2026')
        })

        it('states both years when the range crosses a year boundary', () => {
            expect(formatOpportunityDateRange('2026-12-30T09:55:00', '2027-01-04T15:39:00', 'TBD'))
                .toBe('30 Dec 2026 - 4 Jan 2027')
        })

        it('states the start alone when no usable end exists', () => {
            expect(formatOpportunityDateRange('2026-09-14T09:55:00', undefined, 'TBD'))
                .toBe('14 Sep 2026')
            expect(formatOpportunityDateRange('2026-09-14T09:55:00', 'not-a-date', 'TBD'))
                .toBe('14 Sep 2026')
        })

        it('returns the fallback without a usable start', () => {
            expect(formatOpportunityDateRange(undefined, '2026-09-15T15:39:00', 'TBD'))
                .toBe('TBD')
        })
    })
})
