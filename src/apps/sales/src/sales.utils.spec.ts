import { SalesReport, SalesSummary, SalesSummaryAmount } from './sales.models'
import {
    amountTotal,
    dateColumns,
    dateRangeError,
    defaultDateColumn,
    displayedAmounts,
    displayedColumns,
    expectedRevenueTotal,
    formatSummaryAmount,
    stageBreakdown,
    withDateRange,
    withDrilldown,
    wonSowSignedTotal,
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

    it('sends a drilldown only when both halves are set and restarts at the first page', () => {
        const base = { page: 4, perPage: 25 }
        expect(withDrilldown(base, 'STAGE_NAME', ''))
            .toBe(base)
        expect(withDrilldown(base, '', 'Closing'))
            .toBe(base)
        const applied = withDrilldown(base, 'STAGE_NAME', 'Closing')
        expect(applied)
            .toEqual({ drilldownColumn: 'STAGE_NAME', drilldownValue: 'Closing', page: 1, perPage: 25 })
        expect(withDrilldown(applied, 'STAGE_NAME', 'Closing'))
            .toBe(applied)
        expect(withDrilldown(applied, '', ''))
            .toMatchObject({ drilldownColumn: undefined, drilldownValue: undefined, page: 1 })
    })
})

describe('Sales table columns', () => {
    /** @returns A report schema carrying every PM-6392 column plus the removed ones. Does not throw. */
    function wideReport(): SalesReport {
        return {
            ...report(),
            columns: [
                { dataType: 'picklist', id: 'STAGE_NAME', label: 'Stage' },
                { dataType: 'string', id: 'ACCOUNT', label: 'Reporting Account' },
                { dataType: 'date', id: 'CLOSE_DATE', label: 'Close Date' },
                { dataType: 'string', id: 'OWNER', label: 'Opportunity Owner' },
                { dataType: 'html', id: 'ALERT', label: 'Forecast Alert' },
                { dataType: 'currency', id: 'AMOUNT_CONVERTED', label: 'Amount (Converted)' },
                { dataType: 'string', id: 'NAME', label: 'Opportunity Name' },
                { dataType: 'string', id: 'SMU', label: 'Reporting SMU' },
                { dataType: 'currency', id: 'AMOUNT', label: 'Amount' },
                { dataType: 'string', id: 'NEW_FIELD', label: 'Something New' },
                { dataType: 'string', id: 'MONTH', label: 'Close Month' },
                { dataType: 'currency', id: 'EXP_AMOUNT', label: 'Expected Revenue' },
                { dataType: 'currency', id: 'EXP_CONVERTED', label: 'Expected Revenue (Converted)' },
                { dataType: 'datetime', id: 'CREATED_DATE', label: 'Created Date' },
                { dataType: 'string', id: 'ACCOUNT_NAME', label: 'Account Name' },
                { dataType: 'string', id: 'SUBCON', label: 'Subcontracting End Customer' },
            ],
        }
    }

    it('drops the removed columns and reorders the rest, keeping each cell position', () => {
        const columns = displayedColumns(wideReport())
        expect(columns.map(entry => entry.column.id))
            .toEqual([
                'STAGE_NAME',
                'NAME',
                'ACCOUNT_NAME',
                'SUBCON',
                'SMU',
                'AMOUNT',
                'EXP_AMOUNT',
                'CREATED_DATE',
                'CLOSE_DATE',
                'OWNER',
                // A column the report adds later keeps its report position, behind the ordered ones.
                'NEW_FIELD',
            ])
        // The cell index always addresses the row data, which display order never reorders.
        expect(columns.map(entry => entry.index))
            .toEqual([0, 6, 14, 15, 7, 8, 11, 13, 2, 3, 9])
        expect(displayedColumns(undefined))
            .toEqual([])
    })
})

describe('Sales summary cards and stage breakdown', () => {
    /** @returns A single-currency total for the given column. Does not throw. */
    function amount(columnId: string, label: string, total: number): SalesSummaryAmount {
        return { columnId, count: 1, currencyCode: 'USD', label, mixedCurrency: false, total }
    }

    /** @returns A snapshot summary whose stages arrive out of pipeline order. Does not throw. */
    function summary(): SalesSummary {
        return {
            amounts: [amount('AMOUNT', 'Amount', 900), amount('EXP_AMOUNT', 'Expected Revenue', 400)],
            groups: [{
                amountColumnId: 'AMOUNT',
                buckets: [{
                    amounts: [amount('AMOUNT', 'Amount', 500), amount('EXP_AMOUNT', 'Expected Revenue', 500)],
                    count: 5,
                    label: 'Won - SOW Signed',
                    total: 500,
                }, {
                    amounts: [amount('AMOUNT', 'Amount', 300), amount('EXP_AMOUNT', 'Expected Revenue', 0)],
                    count: 9,
                    label: 'Prospecting',
                    total: 300,
                }, {
                    amounts: [amount('AMOUNT', 'Amount', 100), amount('EXP_AMOUNT', 'Expected Revenue', 40)],
                    count: 2,
                    label: 'Proposal',
                    total: 100,
                }],
                columnId: 'STAGE_NAME',
                currencyCode: 'USD',
                label: 'Stage',
                mixedCurrency: false,
                otherBuckets: 1,
            }],
            recordCount: 16,
        }
    }

    it('reads the Amount and Expected Revenue totals behind the cards', () => {
        expect(amountTotal(summary().amounts)?.total)
            .toBe(900)
        expect(expectedRevenueTotal(summary().amounts)?.total)
            .toBe(400)
        // Only the converted total survives displayedAmounts, so the cards still read from it.
        const converted = [
            amount('AMOUNT', 'Amount', 1),
            amount('AMOUNT_CONVERTED', 'Amount (converted)', 900),
            amount('EXP_AMOUNT', 'Expected Revenue', 2),
            amount('EXP_CONVERTED', 'Expected Revenue (converted)', 400),
        ]
        expect(amountTotal(converted)?.total)
            .toBe(900)
        expect(expectedRevenueTotal(converted)?.total)
            .toBe(400)
        expect(amountTotal([]))
            .toBeUndefined()
        expect(expectedRevenueTotal([amount('FEE', 'Local fee', 5)]))
            .toBeUndefined()
    })

    it('orders stages down the pipeline with both totals and reports the WON SOW Signed value', () => {
        const breakdown = stageBreakdown(summary())
        expect(breakdown?.columnId)
            .toBe('STAGE_NAME')
        expect(breakdown?.otherStages)
            .toBe(1)
        expect(breakdown?.stages.map(stage => [stage.label, stage.count, stage.amount?.total,
            stage.expectedRevenue?.total]))
            .toEqual([
                ['Prospecting', 9, 300, 0],
                ['Proposal', 2, 100, 40],
                ['Won - SOW Signed', 5, 500, 500],
            ])
        expect(wonSowSignedTotal(breakdown)?.total)
            .toBe(500)
        expect(wonSowSignedTotal(undefined))
            .toBeUndefined()
        expect(stageBreakdown(undefined))
            .toBeUndefined()
    })

    it('falls back to the bucket total when the API sends no per-bucket amounts', () => {
        const legacy = summary()
        legacy.groups[0].buckets = [{ count: 3, label: 'Closing', total: 250 }]
        const breakdown = stageBreakdown(legacy)
        expect(breakdown?.stages[0].amount?.total)
            .toBe(250)
        expect(breakdown?.stages[0].expectedRevenue)
            .toBeUndefined()
    })
})
