/* Highcharts requires null to represent missing values without turning them into zero. */
/* eslint-disable unicorn/no-null */
import { FC, ReactNode, useMemo } from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

import { MonthlySalesChart } from './sales-dashboard.service'
import { salesChartTotal, salesChartValue, salesMonthLabel } from './sales-dashboard.utils'
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
 * Renders a monthly chart and accessible data table with currency totals and optional card controls.
 * @param props API chart definition, including units, monthly values, stacking and filter/toggle controls.
 * @returns A responsive chart card; unknown percentages remain gaps and table dashes.
 * @throws Does not throw for empty month or series arrays.
 */
const SalesDashboardChart: FC<{ chart: MonthlySalesChart; controls?: ReactNode }> = props => {
    const chart = props.chart
    const labels = useMemo(() => chart.months.map(month => salesMonthLabel(month.month)), [chart.months])
    const hasTotals = chart.unit === 'currency'
    const showTotal = hasTotals && chart.series.length > 1
    const annual = useMemo(() => chart.series.map(series => salesChartTotal(chart.months.map(month => (
        month.values[series.key]
    )))), [chart])
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
            <figure aria-label={`${chart.title} chart`}>
                <HighchartsReact highcharts={Highcharts} options={options} />
            </figure>
            <details>
                <summary>View monthly data</summary>
                {chart.unit === 'count' && (
                    <p>
                        Counts are unique within each category and month.
                        Members may appear in more than one category or month.
                    </p>
                )}
                <div className={styles.tableScroll}>
                    <table>
                        <caption>{chart.title}</caption>
                        <thead>
                            <tr>
                                <th scope='col'>Month</th>
                                {chart.series.map(series => <th key={series.key} scope='col'>{series.label}</th>)}
                                {showTotal && <th scope='col'>Total</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {hasTotals && (
                                <tr className={styles.annual}>
                                    <th scope='row'>Annual</th>
                                    {chart.series.map((series, index) => (
                                        <td key={series.key}>{salesChartValue(annual[index], chart.unit)}</td>
                                    ))}
                                    {showTotal && <td>{salesChartValue(salesChartTotal(annual), chart.unit)}</td>}
                                </tr>
                            )}
                            {chart.months.map((month, index) => (
                                <tr key={month.month}>
                                    <th scope='row'>{labels[index]}</th>
                                    {chart.series.map(series => (
                                        <td key={series.key}>
                                            {salesChartValue(month.values[series.key], chart.unit)}
                                        </td>
                                    ))}
                                    {showTotal && (
                                        <td>
                                            {salesChartValue(salesChartTotal(chart.series.map(series => (
                                                month.values[series.key]
                                            ))), chart.unit)}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </details>
        </article>
    )
}

export default SalesDashboardChart
