import { useMemo } from 'react'
import { cloneDeep } from 'lodash'
import Highcharts from 'highcharts'

import { getRatingColor, StatsHistory, TC_RATING_COLORS } from '~/libs/core'

// Define the default configuration for the Highcharts rating history chart
export const RATING_CHART_CONFIG: Highcharts.Options = {
    chart: {
        panKey: 'shift',
        panning: {
            enabled: true,
        },
        type: 'line',
        zooming: {
            type: 'x',
        },
    },
    // Disable credits (attribution) in the chart
    credits: { enabled: false },
    // Set chart title
    title: {
        text: 'RATING HISTORY',
    },
    // Configure tooltip display for data points
    tooltip: {
        pointFormat: '{point.x:%Y-%m-%d}: {point.y:.0f}',
    },
    // Configure the X-axis (horizontal axis)
    xAxis: {
        // Configure labels on the X-axis with a specific date format
        labels: {
            format: '{value:%Y-%m-%d}',
        },
        // Set the type of the X-axis to datetime
        type: 'datetime',
    },
    // Configure the Y-axis (vertical axis)
    yAxis: {
        // Set a title for the Y-axis
        title: {
            text: 'Rating',
        },
    },
}

/**
 * Converts raw track history records into Highcharts rating points.
 *
 * @param trackHistory - Raw track history entries from the member stats API.
 * @returns Chronologically sorted chart points. Entries without a finite date or rating are omitted
 * because they do not represent a rating change and would split the line in Highcharts.
 */
export function getRatingHistoryData(trackHistory: Array<StatsHistory>): Highcharts.PointOptionsObject[] {
    return trackHistory
        .reduce<Highcharts.PointOptionsObject[]>((points, challenge) => {
            const date: number | undefined = typeof challenge.date === 'number' && Number.isFinite(challenge.date)
                ? challenge.date
                : challenge.ratingDate
            const rating: number | undefined = typeof challenge.rating === 'number' && Number.isFinite(challenge.rating)
                ? challenge.rating
                : challenge.newRating

            if (
                typeof date !== 'number'
                || !Number.isFinite(date)
                || typeof rating !== 'number'
                || !Number.isFinite(rating)
            ) {
                return points
            }

            points.push({
                color: getRatingColor(rating),
                name: challenge.challengeName,
                x: date,
                y: rating,
            })

            return points
        }, [])
        .sort((a, b) => (a.x as number) - (b.x as number))
}

/**
 * Custom hook to generate Highcharts options for a rating history chart.
 *
 * @param trackHistory - The array of historical stats data.
 * @param seriesName - The name of the series for the chart.
 * @returns Highcharts options for the rating history chart, or undefined when there are no rated
 * history entries to draw.
 */
export function useRatingHistoryOptions(
    trackHistory: Array<StatsHistory> | undefined,
    seriesName: string,
): Highcharts.Options | undefined {
    // Memoized Highcharts options to optimize performance
    const ratingHistoryOptions: Highcharts.Options | undefined = useMemo(() => {
        // Deep clone of the default chart configuration
        const options: Highcharts.Options = cloneDeep(RATING_CHART_CONFIG)

        // Return undefined if the track history data is empty
        if (!trackHistory?.length) return undefined

        const historyData: Highcharts.PointOptionsObject[] = getRatingHistoryData(trackHistory)
        if (!historyData.length) return undefined

        // Configure series for the chart
        options.plotOptions = {
            ...options.plotOptions,
            line: {
                zones: TC_RATING_COLORS.map(tcColor => ({
                    color: tcColor.color,
                    value: tcColor.limit,
                })),
            },
        }

        options.series = [{
            color: 'transparent',
            data: historyData,
            name: seriesName,
            type: 'line',
        }]

        return options
    }, [seriesName, trackHistory])

    return ratingHistoryOptions
}
