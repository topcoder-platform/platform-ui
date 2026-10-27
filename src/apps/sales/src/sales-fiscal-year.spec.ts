import { salesFiscalYear, salesFiscalYearLabel, salesFiscalYearPeriod } from './sales-fiscal-year'

describe('Sales fiscal year titles', () => {
    afterEach(() => jest.useRealTimers())

    it.each([
        ['2026-10-28T00:00:00Z', 2027],
        ['2027-01-01T00:00:00Z', 2027],
        ['2027-03-31T23:59:59Z', 2027],
        ['2027-04-01T00:00:00Z', 2028],
        ['2027-04-01T00:30:00+11:00', 2027],
    ])('labels %s by the fiscal year ending in %s', (date, year) => {
        jest.useFakeTimers()
            .setSystemTime(new Date(date))
        expect(salesFiscalYear())
            .toBe(year)
        expect(salesFiscalYearLabel())
            .toBe(`FY '${String(year)
                .slice(-2)}`)
    })

    it('uses the viewed bounds, including open-ended and multi-year ranges', () => {
        expect(salesFiscalYearPeriod('2026-04-01', '2027-03-31'))
            .toBe('01 April 2026 - 31 March 2027')
        expect(salesFiscalYearLabel('2026-04-01', '2027-03-31'))
            .toBe("FY '27")
        expect(salesFiscalYearLabel('2025-07-01'))
            .toBe("FY '26")
        expect(salesFiscalYearLabel(undefined, '2026-02-01'))
            .toBe("FY '26")
        expect(salesFiscalYearLabel('2026-03-01', '2026-04-30'))
            .toBe("FY '26–'27")
    })
})
