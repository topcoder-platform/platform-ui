import { useMemo } from 'react'
import { cloneDeep, get } from 'lodash'
import Highcharts from 'highcharts'

import { StatsHistory } from '~/libs/core'

// Define the default configuration for the Highcharts rating history chart
export const RATING_CHART_CONFIG: Highcharts.Options = {
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
 * Custom hook to generate Highcharts options for a rating history chart.
 *
 * @param {Array<StatsHistory> | undefined} trackHistory - The array of historical stats data.
 * @param {string} seriesName - The name of the series for the chart.
 * @returns {Highcharts.Options | undefined} - Highcharts options for the rating history chart or
 * undefined if data is empty.
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

        // Determine the date and rating fields based on the first entry in the track history
        const dateField: string = get(trackHistory[0], 'date') ? 'date' : 'ratingDate'
        const ratingField: string = get(trackHistory[0], 'rating') ? 'rating' : 'newRating'

        // Configure series for the chart
        options.series = [{
            data: trackHistory.sort((a, b) => get(b, dateField) - get(a, dateField))
                .map((challenge: StatsHistory) => ({
                    name: challenge.challengeName,
                    x: get(challenge, dateField),
                    y: get(challenge, ratingField),
                })),
            name: seriesName,
            type: 'spline',
        }]

        return options
    }, [seriesName, trackHistory])

    return ratingHistoryOptions
}
