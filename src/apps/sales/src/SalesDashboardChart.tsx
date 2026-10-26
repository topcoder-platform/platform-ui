/* Highcharts requires null to represent missing values without turning them into zero. */
/* eslint-disable unicorn/no-null */
import { FC, useMemo } from 'react'
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
 * Extends Highcharts' shared tooltip with the net total of the visible stacked series.
 * @param unit Chart unit, used for currency/count formatting.
 * @returns A formatter retaining Highcharts' escaped labels and default point formatting.
 * @throws Does not throw for missing or empty points; unknown totals remain dashes.
 */
export function stackedTooltip(unit: MonthlySalesChart['unit']): Highcharts.TooltipFormatterCallbackFunction {
    return function formatter(tooltip: Highcharts.Tooltip) {
        const content = tooltip.defaultFormatter.call(this, tooltip)
        const total = salesChartTotal((this.points ?? []).map(point => point.y))
        const body = Array.isArray(content) ? content.join('') : content
        return `${body}<br/><b>Total: ${salesChartValue(total, unit)}</b>`
    }
}

/**
 * Renders a monthly business chart and equivalent accessible data table, including totals for stacked splits.
 * @param props API chart definition, including units, monthly values and stacking.
 * @returns A responsive chart card; unknown percentages remain gaps and table dashes.
 * @throws Does not throw for empty month or series arrays.
 */
const SalesDashboardChart: FC<{ chart: MonthlySalesChart }> = props => {
    const chart = props.chart
    const labels = useMemo(() => chart.months.map(month => salesMonthLabel(month.month)), [chart.months])
    const showTotal = chart.stacked && chart.series.length > 1 && chart.unit !== 'percent'
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
            formatter: showTotal ? stackedTooltip(chart.unit) : undefined,
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
    }), [chart, labels, showTotal])

    return (
        <article className={styles.card}>
            <h3>{chart.title}</h3>
            <p>{chart.description}</p>
            <figure aria-label={`${chart.title} chart`}>
                <HighchartsReact highcharts={Highcharts} options={options} />
            </figure>
            <details>
                <summary>View monthly data</summary>
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
