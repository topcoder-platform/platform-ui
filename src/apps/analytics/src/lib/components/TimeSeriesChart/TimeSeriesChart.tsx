/** Reusable accessible line chart for daily analytics series. */
/* eslint-disable ordered-imports/ordered-imports */
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import { FC, useMemo } from 'react'

import styles from './TimeSeriesChart.module.scss'

export interface TimeSeriesDefinition {
    color: string
    key: string
    label: string
}

interface TimeSeriesChartProps {
    ariaLabel: string
    points: object[]
    series: TimeSeriesDefinition[]
    variant?: 'area' | 'line'
}

/**
 * Reads a safe finite numeric field from one chart point.
 *
 * @param point normalized daily analytics point.
 * @param key configured metric field.
 * @returns finite metric value or zero.
 * @throws Does not throw.
 */
function pointValue(point: object, key: string): number {
    const value = (point as Record<string, unknown>)[key]
    return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

/**
 * Formats an ISO date without allowing local timezone offsets to change the day.
 *
 * @param value YYYY-MM-DD value.
 * @returns compact month/day label.
 * @throws Does not throw; malformed values are returned unchanged.
 */
function dateLabel(value: string): string {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
    return match ? `${match[2]}/${match[3]}` : value
}

/**
 * Renders a multi-series daily line chart and an equivalent screen-reader table.
 *
 * @param props accessible label, normalized points, series definitions, and optional line/area variant.
 * @returns chart, accessible table, or explicit empty state.
 * @throws Does not throw.
 */
export const TimeSeriesChart: FC<TimeSeriesChartProps> = props => {
    const hasData = props.points.some(point => props.series.some(series => pointValue(point, series.key) > 0))
    const chartType = props.variant ?? 'line'
    const options = useMemo<Highcharts.Options>(() => ({
        accessibility: { enabled: false },
        chart: {
            animation: false,
            backgroundColor: 'transparent',
            height: 360,
            spacing: [16, 12, 8, 4],
            type: chartType,
        },
        colors: props.series.map(series => series.color),
        credits: { enabled: false },
        exporting: { enabled: false },
        legend: {
            align: 'center',
            enabled: props.series.length > 1,
            itemStyle: { color: '#0d3445', fontSize: '12px', fontWeight: '600' },
            verticalAlign: 'top',
        },
        plotOptions: {
            area: {
                fillOpacity: 0.14,
                lineWidth: 2,
            },
            line: { lineWidth: 3 },
            series: {
                animation: false,
                marker: { enabled: props.points.length <= 45, radius: 3 },
                states: { inactive: { opacity: 1 } },
            },
        },
        series: props.series.map(series => ({
            color: series.color,
            data: props.points.map(point => pointValue(point, series.key)),
            name: series.label,
            type: chartType,
        })) as Highcharts.SeriesOptionsType[],
        title: { text: undefined },
        tooltip: {
            headerFormat: '<strong>{point.key}</strong><br/>',
            pointFormat: '<span style="color:{series.color}">●</span> {series.name}: <b>{point.y:,.0f}</b><br/>',
            shared: true,
        },
        xAxis: {
            categories: props.points.map(point => dateLabel(String(
                (point as Record<string, unknown>).date ?? '',
            ))),
            labels: { style: { color: '#5a6f78', fontSize: '11px' } },
            lineColor: '#dce3e9',
            tickColor: '#dce3e9',
        },
        yAxis: {
            allowDecimals: false,
            gridLineColor: '#e7edf1',
            labels: { style: { color: '#5a6f78', fontSize: '11px' } },
            min: 0,
            title: { text: undefined },
        },
    }), [chartType, props.points, props.series])

    if (!hasData) {
        return <div className={styles.empty} role='status'>No activity is available for this period.</div>
    }

    return (
        <figure aria-label={props.ariaLabel} className={styles.figure}>
            <HighchartsReact highcharts={Highcharts} options={options} />
            <table className={styles.screenReaderOnly}>
                <caption>{props.ariaLabel}</caption>
                <thead>
                    <tr>
                        <th scope='col'>Date</th>
                        {props.series.map(series => <th key={series.key} scope='col'>{series.label}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {props.points.map(point => (
                        <tr key={String((point as Record<string, unknown>).date)}>
                            <th scope='row'>{String((point as Record<string, unknown>).date)}</th>
                            {props.series.map(series => (
                                <td key={series.key}>{pointValue(point, series.key)}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </figure>
    )
}

export default TimeSeriesChart
