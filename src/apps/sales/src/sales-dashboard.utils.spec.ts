/* eslint-disable unicorn/no-null */
import { MonthlySalesChart } from './sales-dashboard.service'
import { salesDisplayChart, salesPeriodChart, salesPeriodLabel } from './sales-dashboard.utils'

const chart: MonthlySalesChart = {
    description: '',
    id: 'revenue',
    months: [
        { month: '2026-04-01', values: { a: 10, b: null } },
        { month: '2026-05-01', values: { a: -2.5, b: null } },
        { month: '2026-06-01', values: { a: 0, b: null } },
        { month: '2026-07-01', values: { a: 1, b: 0 } },
        { month: '2026-10-01', values: { a: 2, b: 0 } },
        { month: '2027-01-01', values: { a: 3, b: null } },
        { month: '2027-03-01', values: { a: 4, b: null } },
    ],
    series: [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }],
    stacked: true,
    title: 'Revenue',
    unit: 'currency',
}

it('aggregates April–March fiscal quarters, preserving adjustments, zero and unknown values', () => {
    const quarterly = salesPeriodChart(chart, 'Quarterly')
    expect(quarterly.months.map(month => salesPeriodLabel(month.month, 'Quarterly')))
        .toEqual(['Q1', 'Q2', 'Q3', 'Q4'])
    expect(quarterly.months.map(month => month.values))
        .toEqual([
            { a: 7.5, b: null }, { a: 1, b: 0 }, { a: 2, b: 0 }, { a: 7, b: null },
        ])
    expect(salesPeriodChart(chart, 'Monthly'))
        .toBe(chart)
    expect(chart.months)
        .toHaveLength(7)
})

it('uses distinct API counts instead of adding members who recur in multiple months', () => {
    const counts: MonthlySalesChart = {
        ...chart,
        quarters: [{ month: '2026-04-01', values: { a: 2 } }],
        unit: 'count',
    }
    expect(salesPeriodChart(counts, 'Quarterly').months[0].values)
        .toEqual({ a: 2, b: null })
    expect(salesPeriodChart({ ...counts, quarters: undefined }, 'Quarterly').months[0].values.a)
        .toBeNull()
})

it('hides only empty TC Classic series and displays Won without changing series keys or data', () => {
    const source = { ...chart, series: [{ key: 'a', label: 'Won - SOW Signed' }, { key: 'b', label: 'TC Classic' }] }
    expect(salesDisplayChart(source).series)
        .toEqual([{ key: 'a', label: 'Won' }])
    expect(salesDisplayChart({ ...source, months: [{ month: '2026-04-01', values: { b: -2 } }] }).series)
        .toHaveLength(2)
    expect(source.series[0].label)
        .toBe('Won - SOW Signed')
})
