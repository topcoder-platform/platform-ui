import { SalesReport, SalesSummaryAmount } from './sales.models'
import {
    dateColumns,
    dateRangeError,
    defaultDateColumn,
    displayedAmounts,
    formatSummaryAmount,
    withDateRange,
} from './sales.utils'

/** @returns A synthetic report schema with both pipeline date fields. Does not throw. */
function report(): SalesReport {
    return {
        allData: true,
        columns: [
            { dataType: 'string', id: 'NAME', label: 'Opportunity' },
            { dataType: 'currency', id: 'AMOUNT', label: 'Amount' },
            { dataType: 'datetime', id: 'CREATED_DATE', label: 'Created Date' },
            { dataType: 'date', id: 'CLOSE_DATE', label: 'Close Date' },
        ],
        page: 1,
        perPage: 25,
        refreshAfterSeconds: 60,
        refreshedAt: '2026-09-16T02:00:00Z',
        reportId: 'test-report',
        reportName: 'Bookings By Stage',
        rows: [],
        sourceRowCount: 0,
        total: 0,
        totalPages: 0,
    }
}

describe('Sales date range utilities', () => {
    it('offers only date fields and opens on Created Date for pipeline analysis', () => {
        const columns = dateColumns(report())
        expect(columns.map(column => column.id))
            .toEqual(['CREATED_DATE', 'CLOSE_DATE'])
        expect(defaultDateColumn(columns))
            .toBe('CREATED_DATE')
        expect(dateColumns(undefined))
            .toEqual([])
        expect(defaultDateColumn([]))
            .toBe('')
        expect(defaultDateColumn([{ dataType: 'date', id: 'CLOSE_DATE', label: 'Close Date' }]))
            .toBe('CLOSE_DATE')
    })

    it('rejects an inverted range and a bound without a field before any request', () => {
        expect(dateRangeError('CLOSE_DATE', '2026-09-30', '2026-09-01'))
            .toBe('The From date must be on or before the To date.')
        expect(dateRangeError('', '2026-09-01', ''))
            .toBe('Choose the date field this range applies to.')
        expect(dateRangeError('CLOSE_DATE', '2026-09-01', '2026-09-30'))
            .toBe('')
        expect(dateRangeError('CLOSE_DATE', '', ''))
            .toBe('')
        expect(dateRangeError('', '', ''))
            .toBe('')
    })

    it('sends a range only once a bound is set and restarts at the first page', () => {
        const base = { page: 4, perPage: 25 }
        expect(withDateRange(base, 'CLOSE_DATE', '', ''))
            .toBe(base)
        expect(withDateRange(base, 'CLOSE_DATE', '2026-09-01', ''))
            .toEqual({ dateColumn: 'CLOSE_DATE', dateFrom: '2026-09-01', dateTo: undefined, page: 1, perPage: 25 })
        expect(withDateRange(base, 'CLOSE_DATE', '', '2026-09-30'))
            .toEqual({ dateColumn: 'CLOSE_DATE', dateFrom: undefined, dateTo: '2026-09-30', page: 1, perPage: 25 })
        const applied = withDateRange(base, 'CLOSE_DATE', '2026-09-01', '2026-09-30')
        expect(withDateRange(applied, 'CLOSE_DATE', '2026-09-01', '2026-09-30'))
            .toBe(applied)
        expect(withDateRange(applied, '', '', ''))
            .toMatchObject({ dateColumn: undefined, dateFrom: undefined, dateTo: undefined, page: 1 })
    })

    it('hides a total whose converted counterpart the report also provides', () => {
        /** @returns A single-currency total for the given column. Does not throw. */
        const amount = (columnId: string, label: string): SalesSummaryAmount => ({
            columnId, count: 1, label, mixedCurrency: false, total: 1,
        })

        const converted = amount('AMOUNT_CONVERTED', 'Amount (converted)')
        const plain = amount('AMOUNT', 'Amount')
        const revenue = amount('EXP_AMOUNT', 'Expected Revenue')
        const revenueConverted = amount('CONVERTED_REVENUE', 'Expected Revenue (Converted)')
        expect(displayedAmounts([converted, plain, revenue, revenueConverted]))
            .toEqual([converted, revenueConverted])
        expect(displayedAmounts([plain, revenue]))
            .toEqual([plain, revenue])
        expect(displayedAmounts([]))
            .toEqual([])
    })

    it('labels a total with its shared currency, shows an uncoded one in dollars and leaves a mixed sum bare', () => {
        expect(formatSummaryAmount({
            columnId: 'AMOUNT', count: 2, currencyCode: 'USD', label: 'Amount', mixedCurrency: false, total: 1234.56,
        }))
            .toBe('$1,235')
        expect(formatSummaryAmount({
            columnId: 'EXPECTED_REVENUE', count: 2, label: 'Expected Revenue', mixedCurrency: false, total: 1234.56,
        }))
            .toBe('$1,235')
        expect(formatSummaryAmount({
            columnId: 'AMOUNT', count: 2, label: 'Amount', mixedCurrency: true, total: 1234.56,
        }))
            .toBe('1,235')
        expect(formatSummaryAmount({
            columnId: 'AMOUNT',
            count: 0,
            currencyCode: 'not-a-currency',
            label: 'Amount',
            mixedCurrency: false,
            total: 0,
        }))
            .toBe('0')
    })
})
