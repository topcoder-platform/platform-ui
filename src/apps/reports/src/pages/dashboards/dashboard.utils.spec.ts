import {
    buildDashboardCsvFileName,
    formatCompactInteger,
    formatDashboardMonth,
    formatDashboardRangeLabel,
    formatPercentage,
    getDashboardRange,
} from './dashboard.utils'

describe('dashboard date range utilities', () => {
    const julyReference = new Date('2026-07-23T14:30:00.000Z')

    it('builds the latest six-month range including the current UTC month', () => {
        expect(getDashboardRange(0, julyReference))
            .toEqual({
                endDate: '2026-08-01',
                startDate: '2026-02-01',
            })
    })

    it('builds the immediately previous non-overlapping six-month block', () => {
        expect(getDashboardRange(-1, julyReference))
            .toEqual({
                endDate: '2026-02-01',
                startDate: '2025-08-01',
            })
    })

    it('crosses calendar years without changing the exclusive month boundary', () => {
        const januaryReference = new Date('2026-01-15T12:00:00.000Z')

        expect(getDashboardRange(0, januaryReference))
            .toEqual({
                endDate: '2026-02-01',
                startDate: '2025-08-01',
            })
        expect(getDashboardRange(-1, januaryReference))
            .toEqual({
                endDate: '2025-08-01',
                startDate: '2025-02-01',
            })
    })

    it('uses calendar months across a leap-day transition', () => {
        const leapDayReference = new Date('2024-02-29T23:59:59.999Z')

        expect(getDashboardRange(0, leapDayReference))
            .toEqual({
                endDate: '2024-03-01',
                startDate: '2023-09-01',
            })
    })

    it('uses UTC when a timestamp offset crosses a local month boundary', () => {
        const augustInLocalTime = new Date('2026-08-01T00:30:00+14:00')

        expect(getDashboardRange(0, augustInLocalTime))
            .toEqual({
                endDate: '2026-08-01',
                startDate: '2026-02-01',
            })
    })

    it('rejects invalid reference dates and fractional period offsets', () => {
        expect(() => getDashboardRange(0, new Date('invalid')))
            .toThrow('Dashboard reference date must be valid.')
        expect(() => getDashboardRange(-0.5, julyReference))
            .toThrow('Dashboard period offset must be an integer.')
    })
})

describe('dashboard labels and metric formatting', () => {
    it('formats stable UTC month labels', () => {
        expect(formatDashboardMonth('2026-07-01T00:00:00.000Z'))
            .toBe('Jul ’26')
        expect(formatDashboardMonth('2026-08-01T00:30:00+14:00'))
            .toBe('Jul ’26')
    })

    it('formats the inclusive display months for an exclusive date range', () => {
        expect(formatDashboardRangeLabel({
            endDate: '2026-08-01',
            startDate: '2026-02-01',
        }))
            .toBe('Feb ’26 – Jul ’26')
    })

    it('formats a range spanning a year boundary', () => {
        expect(formatDashboardRangeLabel({
            endDate: '2026-02-01',
            startDate: '2025-08-01',
        }))
            .toBe('Aug ’25 – Jan ’26')
    })

    it('rejects invalid or empty ranges', () => {
        expect(() => formatDashboardRangeLabel({
            endDate: '2026-02-30',
            startDate: '2026-02-01',
        }))
            .toThrow('Dashboard range dates must be valid calendar dates.')
        expect(() => formatDashboardRangeLabel({
            endDate: '2026-02-01',
            startDate: '2026-02-01',
        }))
            .toThrow('Dashboard range end date must be after its start date.')
    })

    it('formats compact rounded integer counts', () => {
        expect(formatCompactInteger(0))
            .toBe('0')
        expect(formatCompactInteger(999))
            .toBe('999')
        expect(formatCompactInteger(1_234))
            .toBe('1.2K')
        expect(formatCompactInteger(18_214))
            .toBe('18.2K')
        expect(formatCompactInteger(2_000_000))
            .toBe('2M')
    })

    it('formats percentage-point values with at most one decimal place', () => {
        expect(formatPercentage(0))
            .toBe('0%')
        expect(formatPercentage(72.74))
            .toBe('72.7%')
        expect(formatPercentage(100))
            .toBe('100%')
    })
})

describe('dashboard CSV filenames', () => {
    it('combines a normalized slug with the exact API request range', () => {
        expect(buildDashboardCsvFileName(
            'Challenge Registrants / Submitters',
            {
                endDate: '2026-08-01',
                startDate: '2026-02-01',
            },
        ))
            .toBe('challenge-registrants-submitters-2026-02-01-to-2026-08-01.csv')
    })

    it('uses the reports dashboard stem for the landing-page aggregate', () => {
        expect(buildDashboardCsvFileName(
            ' ALL ',
            {
                endDate: '2026-08-01',
                startDate: '2026-02-01',
            },
        ))
            .toBe('reports-dashboards-2026-02-01-to-2026-08-01.csv')
    })

    it('rejects empty slugs and invalid ranges', () => {
        expect(() => buildDashboardCsvFileName(
            '---',
            {
                endDate: '2026-08-01',
                startDate: '2026-02-01',
            },
        ))
            .toThrow('Dashboard slug must contain a letter or number.')
        expect(() => buildDashboardCsvFileName(
            'new-signups',
            {
                endDate: '2026-02-01',
                startDate: '2026-08-01',
            },
        ))
            .toThrow('Dashboard range end date must be after its start date.')
    })
})
