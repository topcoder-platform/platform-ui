/** Accessible time series chart for analytics reports. */
/* eslint-disable ordered-imports/ordered-imports */
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import { FC, useMemo } from 'react'

import { formatReportDate } from '../../../../../../libs/shared/lib/utils/report-date'

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
    variant?: 'area' | 'line' | 'column-trend'
    valueDecimals?: number
    valueSuffix?: string
    xAxisTitle?: string
    yAxisTitle?: string
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

/** Average up to seven consecutive UTC days from the selected range, including quiet days. */
function sevenDayAverage(values: number[]): number[] {
    return values.map((_, index) => {
        const window = values.slice(Math.max(0, index - 6), index + 1)
        const average = window.reduce((total, value) => total + value, 0) / window.length
        return Number(average.toFixed(2))
    })
}

/**
 * Renders daily series and an equivalent screen-reader table.
 *
 * @param props accessible label, normalized points, series definitions, and chart variant.
 * @returns chart, accessible table, or explicit empty state.
 * @throws Does not throw.
 */
export const TimeSeriesChart: FC<TimeSeriesChartProps> = props => {
    const chartType = props.variant === 'column-trend' ? 'column' : props.variant ?? 'line'
    const plottedSeries = useMemo(() => props.series.flatMap(definition => {
        const data = props.points.map(point => pointValue(point, definition.key))
        const primary = {
            color: definition.color,
            data,
            id: definition.key,
            name: definition.label,
            type: chartType,
        }
        if (chartType !== 'column') return [primary]
        return [
            {
                ...primary,
                color: Highcharts.color(definition.color)
                    .setOpacity(0.48)
                    .get('rgba') as string,
            },
            {
                ...primary,
                data: sevenDayAverage(data),
                id: `${definition.key}-trend`,
                linkedTo: definition.key,
                marker: { enabled: data.length === 1 },
                name: `${definition.label} (7-day average)`,
                tooltip: { valueDecimals: 2 },
                type: 'line' as const,
                zIndex: 2,
            },
        ]
    }), [chartType, props.points, props.series])
    const hasData = plottedSeries.some(item => item.data.some(value => value > 0))
    const options = useMemo<Highcharts.Options>(() => ({
        accessibility: { enabled: false },
        chart: {
            animation: false,
            backgroundColor: 'transparent',
            height: 360,
            // Leave each daily bar room on small screens and long date ranges.
            scrollablePlotArea: chartType === 'column' ? {
                minWidth: 80 + props.points.length * (6 * props.series.length + 6),
            } : undefined,
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
            column: { borderWidth: 0, groupPadding: 0.1, pointPadding: 0.05 },
            line: { lineWidth: 3 },
            series: {
                animation: false,
                marker: { enabled: props.points.length <= 45, radius: 3 },
                states: { inactive: { opacity: 1 } },
            },
        },
        series: plottedSeries as Highcharts.SeriesOptionsType[],
        title: { text: undefined },
        tooltip: {
            headerFormat: '<strong>{point.key}</strong><br/>',
            pointFormat: '<span style="color:{series.color}">●</span> {series.name}: <b>{point.y}</b><br/>',
            shared: true,
            valueDecimals: props.valueDecimals ?? 0,
            valueSuffix: props.valueSuffix ?? '',
        },
        xAxis: {
            categories: props.points.map(point => formatReportDate(String(
                (point as Record<string, unknown>).date ?? '',
            ))),
            labels: { style: { color: '#5a6f78', fontSize: '11px' } },
            lineColor: '#dce3e9',
            tickColor: '#dce3e9',
            title: { text: props.xAxisTitle },
        },
        yAxis: {
            allowDecimals: (props.valueDecimals ?? 0) > 0,
            gridLineColor: '#e7edf1',
            labels: { style: { color: '#5a6f78', fontSize: '11px' } },
            min: 0,
            title: { text: props.yAxisTitle },
        },
    }), [chartType, props.points, props.series, props.valueDecimals, props.valueSuffix,
        props.xAxisTitle, props.yAxisTitle, plottedSeries])

    if (!hasData) {
        return <div className={styles.empty} role='status'>No activity is available for this period.</div>
    }

    return (
        <figure aria-label={props.ariaLabel} className={styles.figure}>
            <HighchartsReact highcharts={Highcharts} options={options} />
            <div className={styles.screenReaderOnly}>
                <table>
                    <caption>{props.ariaLabel}</caption>
                    <thead>
                        <tr>
                            <th scope='col'>Date</th>
                            {plottedSeries.map(item => <th key={item.id} scope='col'>{item.name}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {props.points.map((point, index) => (
                            <tr key={String((point as Record<string, unknown>).date)}>
                                <th scope='row'>{formatReportDate(String((point as Record<string, unknown>).date))}</th>
                                {plottedSeries.map(item => (
                                    <td key={item.id}>{item.data[index]}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </figure>
    )
}

export default TimeSeriesChart
