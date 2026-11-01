/* API nulls represent unknown values, rather than zero. */
/* eslint-disable unicorn/no-null */
import { MonthlySalesChart, SalesDashboardPeriod } from './sales-dashboard.service'

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

/** Returns the UTC start of an April–March fiscal quarter. */
export function salesQuarterStart(month: string): string {
    const date = new Date(`${month}T00:00:00Z`)
    return new Date(Date.UTC(date.getUTCFullYear(), Math.floor(date.getUTCMonth() / 3) * 3, 1))
        .toISOString()
        .slice(0, 10)
}

/** Labels April–June as Q1 and January–March as Q4. */
export function salesPeriodLabel(month: string, period: SalesDashboardPeriod): string {
    if (period === 'Monthly') return salesMonthLabel(month)
    return `Q${Math.floor(((new Date(`${month}T00:00:00Z`)
        .getUTCMonth() + 9) % 12) / 3) + 1}`
}

/** Uses event-level counts supplied by the API; amounts are additive across fiscal-quarter months. */
export function salesPeriodChart(chart: MonthlySalesChart, period: SalesDashboardPeriod): MonthlySalesChart {
    if (period === 'Monthly') return chart
    const quarters = [...new Set(chart.months.map(month => salesQuarterStart(month.month)))].sort()
    return {
        ...chart,
        months: quarters.map(quarter => ({
            month: quarter,
            values: Object.fromEntries(chart.series.map(series => [series.key,
                chart.unit === 'currency'
                    ? salesChartTotal(chart.months.filter(month => salesQuarterStart(month.month) === quarter)
                        .map(month => month.values[series.key]))
                    : chart.quarters?.find(month => month.month === quarter)?.values[series.key] ?? null,
            ])),
        })),
    }
}

/** Annual amounts are additive; distinct counts and percentages require an explicit API aggregate. */
export function salesAnnualValue(chart: MonthlySalesChart, key: string): number | null {
    return chart.unit === 'currency' ? salesChartTotal(chart.months.map(month => month.values[key]))
        : chart.annual?.[key] ?? null
}

/** Hides the retired empty offering while retaining nonzero historical values, and normalizes stage display. */
export function salesDisplayChart(chart: MonthlySalesChart): MonthlySalesChart {
    return {
        ...chart,
        series: chart.series.filter(series => !/^tc classic$/i.test(series.label.trim())
            || chart.months.some(month => !!month.values[series.key]))
            .map(series => ({ ...series, label: salesStageLabel(series.label) })),
    }
}

/** Changes only presentation; Salesforce stage keys remain intact for drilldowns. */
export function salesStageLabel(label: string): string {
    return /^won\s*[-–—]\s*sow signed$/i.test(label.trim()) ? 'Won' : label
}
