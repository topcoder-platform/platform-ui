/* Highcharts requires null to represent missing values without turning them into zero. */
/* eslint-disable unicorn/no-null */
import { FC, useMemo } from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

import { MonthlySalesChart } from './sales-dashboard.service'
import styles from './SalesDashboardsPage.module.scss'

const colors = ['#0d8984', '#0f62fe', '#6c5ce7', '#ff8a00', '#6aae3f', '#d7476f']

/**
 * Renders a monthly business chart and equivalent accessible data table.
 * @param props API chart definition, including units, monthly values and stacking.
 * @returns A responsive chart card; unknown percentages remain gaps and table dashes.
 * @throws Does not throw for empty month or series arrays.
 */
const SalesDashboardChart: FC<{ chart: MonthlySalesChart }> = props => {
    const chart = props.chart
    const labels = useMemo(() => chart.months.map(month => new Date(`${month.month}T00:00:00Z`)
        .toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC', year: 'numeric' })), [chart.months])
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
            shared: true,
            valueDecimals: chart.unit === 'count' ? 0 : 2,
            valuePrefix: chart.unit === 'currency' ? '$' : '',
            valueSuffix: chart.unit === 'percent' ? '%' : '',
        },
        xAxis: { categories: labels },
        yAxis: {
            allowDecimals: chart.unit !== 'count',
            title: { text: chart.unit === 'currency' ? 'USD' : chart.unit === 'percent' ? 'Markup (%)' : 'Members' },
        },
    }), [chart, labels])

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
                            </tr>
                        </thead>
                        <tbody>
                            {chart.months.map((month, index) => (
                                <tr key={month.month}>
                                    <th scope='row'>{labels[index]}</th>
                                    {chart.series.map(series => (
                                        <td key={series.key}>
                                            {month.values[series.key] == null ? '—' : (
                                                <>
                                                    {chart.unit === 'currency' ? '$' : ''}
                                                    {month.values[series.key]?.toLocaleString('en-US', {
                                                        maximumFractionDigits: chart.unit === 'count' ? 0 : 2,
                                                    })}
                                                    {chart.unit === 'percent' ? '%' : ''}
                                                </>
                                            )}
                                        </td>
                                    ))}
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
