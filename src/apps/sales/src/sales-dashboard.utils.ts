/* API nulls represent unknown values, rather than zero. */
/* eslint-disable unicorn/no-null */
import { MonthlySalesChart } from './sales-dashboard.service'

/**
 * Sums known values for chart tooltips and customer-table margins.
 * @param values Values in a month or across the fiscal period; null/undefined are unknown.
 * @returns Their sum, including negative adjustments, or null when no value is known.
 * @throws Does not throw.
 */
export function salesChartTotal(values: Array<number | null | undefined>): number | null {
    const known = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
    return known.length ? known.reduce((total, value) => total + value, 0) : null
}

/**
 * Formats chart and table values consistently, retaining cents and unknown values.
 * @param value API amount, count or percentage; null/undefined is unknown.
 * @param unit Display unit; currency charts use USD.
 * @returns A localized value or an em dash. Does not throw.
 */
export function salesChartValue(value: number | null | undefined, unit: MonthlySalesChart['unit']): string {
    if (value == null) return '—'
    const formatted = value.toLocaleString('en-US', {
        currency: 'USD',
        maximumFractionDigits: unit === 'count' ? 0 : 2,
        style: unit === 'currency' ? 'currency' : 'decimal',
    })
    return unit === 'percent' ? `${formatted}%` : formatted
}

/**
 * Labels a chart month in UTC so local time zones cannot move it to the preceding month.
 * @param month First-day ISO date from the API.
 * @returns A month/year label used by charts and tables. Does not throw for valid API dates.
 */
export function salesMonthLabel(month: string): string {
    return new Date(`${month}T00:00:00Z`)
        .toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC', year: 'numeric' })
}
