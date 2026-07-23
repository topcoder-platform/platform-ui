import { FC, useMemo } from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

import {
    DashboardSlug,
} from '../../lib/services'

import {
    dashboardDefinitions,
    DashboardMonth,
} from './dashboard.config'
import {
    formatCompactInteger,
    formatDashboardMonth,
} from './dashboard.utils'
import styles from './Dashboards.module.scss'

type DashboardChartProps = {
    compact?: boolean
    dashboard: DashboardSlug
    months: DashboardMonth[]
}

/**
 * Reads a numeric chart-series value from a dashboard month.
 *
 * @param month Dashboard month returned by the reports API.
 * @param key Series field configured for the dashboard.
 * @returns A finite numeric value, falling back to zero.
 * @throws Does not throw.
 */
function getSeriesValue(month: DashboardMonth, key: string): number {
    const value = (month as unknown as Record<string, unknown>)[key]
    return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

/**
 * Renders the configured Highcharts visualization for a dashboard dataset.
 *
 * @param props Dashboard slug, monthly data, and compact-card presentation flag.
 * @returns A stacked column, stacked bar, or grouped bar chart with an
 * accessible monthly data table.
 * @throws Does not throw. Invalid or absent point values are rendered as zero.
 */
export const DashboardChart: FC<DashboardChartProps> = props => {
    const definition = dashboardDefinitions[props.dashboard]
    const hasData = props.months.some(month => (
        definition.series.some(series => getSeriesValue(month, series.key) > 0)
    ))

    const options = useMemo<Highcharts.Options>(() => ({
        accessibility: {
            enabled: false,
        },
        chart: {
            animation: false,
            backgroundColor: 'transparent',
            height: props.compact ? 260 : 470,
            spacing: props.compact
                ? [8, 2, 4, 2]
                : [16, 8, 8, 8],
            type: definition.chartType,
        },
        colors: definition.series.map(series => series.color),
        credits: {
            enabled: false,
        },
        exporting: {
            enabled: false,
        },
        legend: {
            align: 'center',
            itemDistance: props.compact ? 14 : 24,
            itemStyle: {
                color: '#111b46',
                fontSize: props.compact ? '11px' : '13px',
                fontWeight: '400',
            },
            layout: 'horizontal',
            symbolHeight: 10,
            symbolRadius: 0,
            symbolWidth: 10,
            verticalAlign: 'top',
        },
        plotOptions: {
            series: {
                animation: false,
                borderWidth: 0,
                groupPadding: definition.stacked ? 0.16 : 0.1,
                pointPadding: definition.stacked ? 0 : 0.08,
                stacking: definition.stacked ? 'normal' : undefined,
                states: {
                    inactive: {
                        opacity: 1,
                    },
                },
            },
        },
        series: definition.series.map(series => ({
            color: series.color,
            data: props.months.map(month => getSeriesValue(month, series.key)),
            name: series.label,
            type: definition.chartType,
        })) as Highcharts.SeriesOptionsType[],
        title: {
            text: undefined,
        },
        tooltip: {
            headerFormat: '<strong>{point.key}</strong><br/>',
            pointFormat: '<span style="color:{series.color}">●</span> {series.name}: <b>{point.y:,.0f}</b><br/>',
            shared: true,
        },
        xAxis: {
            categories: props.months.map(month => formatDashboardMonth(month.month)),
            labels: {
                style: {
                    color: '#111b46',
                    fontSize: props.compact ? '11px' : '13px',
                },
            },
            lineColor: '#dce1eb',
            tickColor: '#dce1eb',
            title: {
                text: undefined,
            },
        },
        yAxis: {
            allowDecimals: false,
            gridLineColor: '#e5e8ef',
            labels: {
                // Highcharts supplies the axis-label context through `this`.
                formatter() {
                    // eslint-disable-next-line react/no-this-in-sfc
                    return formatCompactInteger(Number(this.value))
                },
                style: {
                    color: '#111b46',
                    fontSize: props.compact ? '10px' : '12px',
                },
            },
            min: 0,
            title: {
                text: undefined,
            },
        },
    }), [
        definition,
        props.compact,
        props.months,
    ])

    if (!hasData) {
        return (
            <div className={styles.emptyChart} role='status'>
                No data is available for this period.
            </div>
        )
    }

    return (
        <figure
            aria-label={`${definition.title} chart`}
            className={styles.chartFigure}
        >
            <HighchartsReact highcharts={Highcharts} options={options} />
            <table className={styles.screenReaderOnly}>
                <caption>
                    {definition.title}
                    {' monthly data'}
                </caption>
                <thead>
                    <tr>
                        <th scope='col'>Month</th>
                        {definition.series.map(series => (
                            <th key={series.key} scope='col'>{series.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {props.months.map(month => (
                        <tr key={month.month}>
                            <th scope='row'>{formatDashboardMonth(month.month)}</th>
                            {definition.series.map(series => (
                                <td key={series.key}>
                                    {getSeriesValue(month, series.key)
                                        .toLocaleString('en-US')}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </figure>
    )
}

export default DashboardChart
