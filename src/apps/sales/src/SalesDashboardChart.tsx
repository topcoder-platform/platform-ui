/* Highcharts requires null to represent missing values without turning them into zero. */
/* eslint-disable unicorn/no-null */
import { FC, ReactNode, useMemo } from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

import { MonthlySalesChart, SalesDashboardPeriod } from './sales-dashboard.service'
import {
    salesChartTotal,
    salesChartValue,
    salesDisplayChart,
    salesPeriodChart,
    salesPeriodLabel,
    salesQuarterStart,
} from './sales-dashboard.utils'
import { salesFiscalYearLabel } from './sales-fiscal-year'
import SalesDashboardTable from './SalesDashboardTable'
import styles from './SalesDashboardsPage.module.scss'

const colors = ['#0d8984', '#0f62fe', '#6c5ce7', '#ff8a00', '#6aae3f', '#d7476f']

/**
 * Formats a y-axis tick compactly in the chart's unit. Highcharts' default would label
 * a 500k tick interval as "1 000k" and "1 500k".
 * @param value Tick value, possibly negative for revenue adjustments.
 * @param unit Chart unit; currency is USD, as the API states.
 * @returns A label such as $1.5M, -$30K, 40 or 12.5%.
 * @throws Does not throw.
 */
export function axisLabel(value: number, unit: MonthlySalesChart['unit']): string {
    const label = new Intl.NumberFormat('en-US', {
        currency: 'USD',
        maximumFractionDigits: 1,
        minimumFractionDigits: 0,
        notation: 'compact',
        style: unit === 'currency' ? 'currency' : 'decimal',
    })
        .format(value)
    return unit === 'percent' ? `${label}%` : label
}

/** One headline figure: a month's value and how it changed from the month before. */
export interface ChartHeadlineFigure {
    /** Series label, present only when each series is headlined separately. */
    label?: string
    value: number | null
    change?: { direction: 'up' | 'down' | 'flat'; text: string }
}

/** The headline shown above a chart: its figures and a caption naming the month they describe. */
export interface ChartHeadline {
    caption: string
    figures: ChartHeadlineFigure[]
}

/**
 * Adds a month's values for the given series.
 * @param month Chart month, or undefined before the first month.
 * @param keys Series keys to add.
 * @returns The total, or null when the month or all of its values are unknown.
 * @throws Does not throw.
 */
function monthTotal(month: MonthlySalesChart['months'][number] | undefined, keys: string[]): number | null {
    const values = keys.map(key => month?.values[key])
        .filter((value): value is number => typeof value === 'number')
    return values.length ? values.reduce((sum, value) => sum + value, 0) : null
}

/**
 * Describes the change from the previous month: percentage points for percent charts, otherwise a
 * relative change. There is no change when either value is unknown, or when the previous value is zero.
 * @param value Headlined month value.
 * @param previous Previous month value.
 * @param unit Chart unit.
 * @param comparison Names the previous month, e.g. "last month".
 * @returns Change text such as "+53.4% vs last month" with its direction, or undefined.
 * @throws Does not throw.
 */
function monthChange(
    value: number | null,
    previous: number | null,
    unit: MonthlySalesChart['unit'],
    comparison: string,
): ChartHeadlineFigure['change'] {
    if (value === null || previous === null || (unit !== 'percent' && previous === 0)) return undefined
    const difference = unit === 'percent' ? value - previous : ((value - previous) / Math.abs(previous)) * 100
    const change = Math.round(difference * 10) / 10
    return {
        direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
        text: `${change > 0 ? '+' : ''}${change.toFixed(1)}${unit === 'percent' ? ' pp' : '%'} vs ${comparison}`,
    }
}

/**
 * Builds a chart's headline, as in the executive overview: the current UTC month, compared with the
 * full previous month. Stacked charts headline their stack total and single-series charts their value.
 * Other multi-series charts, such as flexible talent, headline each series, because those series cannot be added.
 * When nothing is recorded for the current month yet (revenue is recognized at month end), the latest
 * month with data is headlined instead, and the caption names it.
 * @param chart API chart.
 * @param expectedCloses Whether the current month includes opportunities expected to close later in it
 * (pipeline charts by close date).
 * @param now Current time. Charts without the current period headline their latest period instead.
 * @param period Monthly or fiscal-quarter comparison, matching the supplied chart data.
 * @returns The headline, or undefined for a chart with no months.
 * @throws Does not throw.
 */
export function chartHeadline(
    chart: MonthlySalesChart,
    expectedCloses: boolean = false,
    now: Date = new Date(),
    period: SalesDashboardPeriod = 'Monthly',
): ChartHeadline | undefined {
    const monthStart = `${now.toISOString()
        .slice(0, 7)}-01`
    const currentMonth = period === 'Quarterly' ? salesQuarterStart(monthStart) : monthStart
    const periodName = period === 'Quarterly' ? 'quarter' : 'month'
    const groups: Array<{ keys: string[]; label?: string }> = chart.stacked || chart.series.length === 1
        ? [{ keys: chart.series.map(series => series.key) }]
        : chart.series.map(series => ({ keys: [series.key], label: series.label }))
    const recorded = (index: number): boolean => groups.some(group => !!monthTotal(chart.months[index], group.keys))
    const currentIndex = chart.months.findIndex(month => month.month === currentMonth)
    const latestRecorded = chart.months.map((month, index) => index)
        .slice(0, Math.max(currentIndex, 0))
        .reverse()
        .find(recorded)
    const index = currentIndex < 0 ? chart.months.length - 1
        : recorded(currentIndex) || latestRecorded === undefined ? currentIndex : latestRecorded
    if (index < 0) return undefined
    const figures = groups.map(group => {
        const value = monthTotal(chart.months[index], group.keys)
        return {
            change: monthChange(
                value,
                monthTotal(chart.months[index - 1], group.keys),
                chart.unit,
                index === currentIndex ? `last ${periodName}` : `previous ${periodName}`,
            ),
            label: group.label,
            value,
        }
    })
    const monthName = period === 'Quarterly'
        ? `${salesPeriodLabel(chart.months[index].month, period)}, ${salesFiscalYearLabel(chart.months[index].month)}`
        : new Date(`${chart.months[index].month}T00:00:00Z`)
            .toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC', year: 'numeric' })
    const caption = currentIndex < 0 ? monthName
        : index !== currentIndex ? `${monthName}, the latest ${periodName} with data`
            : expectedCloses && chart.months.some(month => month.month > currentMonth)
                ? `Current ${periodName}, including expected closes`
                : `Current ${periodName} to date`
    return {
        caption: chart.stacked && chart.unit === 'count' ? `${caption} · sums the stacked series` : caption,
        figures,
    }
}

/**
 * Formats a headline value in full, so it can be read against the chart's compact axis.
 * @param value Headline value; null is unknown.
 * @param unit Chart unit.
 * @returns A value such as $4,377,046, 359, 32.9% or an em dash.
 * @throws Does not throw.
 */
function headlineValue(value: number | null, unit: MonthlySalesChart['unit']): string {
    if (value === null) return '—'
    const label = value.toLocaleString('en-US', {
        currency: 'USD',
        maximumFractionDigits: unit === 'percent' ? 1 : 0,
        style: unit === 'currency' ? 'currency' : 'decimal',
    })
    return unit === 'percent' ? `${label}%` : label
}

/**
 * Places the net total of visible series before category details in Highcharts' shared tooltip.
 * @param unit Chart unit, used for currency/count formatting.
 * @returns A formatter retaining Highcharts' escaped labels and default point formatting.
 * @throws Does not throw for missing or empty points; unknown totals remain dashes.
 */
export function chartTooltip(unit: MonthlySalesChart['unit']): Highcharts.TooltipFormatterCallbackFunction {
    return function formatter(tooltip: Highcharts.Tooltip) {
        const content = tooltip.defaultFormatter.call(this, tooltip)
        const total = salesChartTotal((this.points ?? [this]).map(point => point.y))
        const totalLine = `<b>Total: ${salesChartValue(total, unit)}</b><br/>`
        return Array.isArray(content) ? [content[0], totalLine, ...content.slice(1)].join('') : totalLine + content
    }
}

/**
 * Renders a monthly business chart with its headline and an equivalent accessible data table.
 * @param props API chart definition, including units, monthly values and stacking, and whether the
 * current month includes expected closes, plus optional card-level filter/toggle controls.
 * @returns A responsive chart card; unknown percentages remain gaps and table dashes.
 * @throws Does not throw for empty month or series arrays.
 */
const SalesDashboardChart: FC<{
    chart: MonthlySalesChart; expectedCloses?: boolean; controls?: ReactNode; period?: SalesDashboardPeriod
}> = props => {
    const period = props.period ?? 'Monthly'
    const monthlyChart = useMemo(() => salesDisplayChart(props.chart), [props.chart])
    const chart = useMemo(() => salesPeriodChart(monthlyChart, period), [monthlyChart, period])
    const headline = useMemo(
        () => chartHeadline(chart, props.expectedCloses, new Date(), period),
        [chart, props.expectedCloses, period],
    )
    const labels = useMemo(
        () => chart.months.map(month => salesPeriodLabel(month.month, period)),
        [chart.months, period],
    )
    const hasTotals = chart.unit === 'currency'
    const options = useMemo<Highcharts.Options>(() => ({
        chart: { backgroundColor: 'transparent', height: 320, type: 'column' },
        colors,
        credits: { enabled: false },
        legend: { enabled: chart.series.length > 1 },
        plotOptions: { column: { borderWidth: 0, stacking: chart.stacked ? 'normal' : undefined } },
        series: chart.series.map(series => ({
            data: chart.months.map(month => month.values[series.key] ?? null),
            name: series.label,
            type: 'column',
        })),
        title: { text: undefined },
        tooltip: {
            formatter: hasTotals ? chartTooltip(chart.unit) : undefined,
            shared: true,
            valueDecimals: chart.unit === 'count' ? 0 : 2,
            valuePrefix: chart.unit === 'currency' ? '$' : '',
            valueSuffix: chart.unit === 'percent' ? '%' : '',
        },
        xAxis: { categories: labels },
        yAxis: {
            allowDecimals: chart.unit !== 'count',
            labels: { formatter: context => axisLabel(Number(context.value), chart.unit) },
            title: { text: chart.unit === 'currency' ? 'USD' : chart.unit === 'percent' ? 'Markup (%)' : 'Members' },
        },
    }), [chart, labels, hasTotals])

    return (
        <article className={styles.card} aria-label={chart.title}>
            <h3>{chart.title}</h3>
            {props.controls}
            <p>{chart.description}</p>
            {headline && (
                <div className={styles.headline}>
                    <div className={styles.figures}>
                        {headline.figures.map(figure => (
                            <div className={styles.figure} key={figure.label ?? 'total'}>
                                {figure.label && <span className={styles.figureLabel}>{figure.label}</span>}
                                <span className={styles.figureValue}>
                                    <strong>{headlineValue(figure.value, chart.unit)}</strong>
                                    {figure.change && (
                                        <span className={`${styles.change} ${styles[figure.change.direction]}`}>
                                            {figure.change.text}
                                        </span>
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>
                    <span className={styles.caption}>{headline.caption}</span>
                </div>
            )}
            <figure aria-label={`${chart.title} chart`}>
                <HighchartsReact highcharts={Highcharts} options={options} />
            </figure>
            <details>
                <summary>{`View ${period.toLowerCase()} data`}</summary>
                {chart.unit === 'count' && (
                    <p>
                        Counts are unique within each category and period.
                        Members may appear in more than one category.
                        Unavailable annual or quarterly counts are shown as a dash.
                    </p>
                )}
                <SalesDashboardTable chart={chart} period={period} caption={chart.title} />
            </details>
        </article>
    )
}

export default SalesDashboardChart
