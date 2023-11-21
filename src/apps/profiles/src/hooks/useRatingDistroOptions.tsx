import { useMemo } from 'react'
import { cloneDeep, isEmpty, toPairs } from 'lodash'
import AnnotationsModule from 'highcharts/modules/annotations'
import Highcharts from 'highcharts'

import { getRatingColor, UserStatsDistributionResponse } from '~/libs/core'

AnnotationsModule(Highcharts)

interface TrackRange {
    end: number
    name: string
    value: number
    start: number
}

/**
 * Parses the api distribution data and returns more easy to use objects (TrackRange)
 * @param distribution - The api data
 * @returns - The optimized objects
 */
const getRanges = (distribution: any): TrackRange[] => (
    toPairs(distribution as {[key: string]: number})
        .map(([name, number]) => {
            const match = (name.match(/ratingRange(\d+)To(\d+)/) ?? []).slice(1)
            const [start, end] = match.map((rating: string) => parseInt(rating, 10))

            return {
                end,
                name,
                start,
                value: number,
            }
        })
        .sort((a, b) => a.start - b.start)
)

/**
 * Trims the start & end 0 values from the ranges array
 * @param ranges - The ranges to be parsed and trimmed
 * @returns - The trimmed ranges
 */
const getNonZeroRanges = (ranges: TrackRange[]): TrackRange[] => {
    let st = 0
    while (ranges[st]?.value === 0) {
        st += 1
    }

    let end = ranges.length - 1
    while (end > st && ranges[end]?.value === 0) {
        end -= 1
    }

    return ranges.slice(st, end + 1)
}

// Define the default configuration for the Highcharts rating distribution chart
export const RATING_DISTRO_CHART_CONFIG: Highcharts.Options = {
    // Set chart type to column
    chart: { type: 'column' },
    // Disable credits (attribution) in the chart
    credits: { enabled: false },
    // Disable legend (chart legend)
    legend: { enabled: false },
    // Configure plot options for the column chart
    plotOptions: {
        column: {
            // Disable data labels for individual data points
            dataLabels: {
                enabled: false,
            },
            // Adjust spacing for groups and individual points in the column chart
            groupPadding: 0.025,
            minPointLength: 5,
            pointPadding: 0,
        },
    },
    // Set chart title
    title: {
        text: 'RATING DISTRIBUTION',
    },
    // Configure tooltip display for data points
    tooltip: {
        pointFormat: '{point.y:.0f} Coders',
    },
    // Hide the X-axis (horizontal axis)
    xAxis: { visible: false },
    // Configure the Y-axis (vertical axis)
    yAxis: {
        // Set a title for the Y-axis
        title: {
            text: 'Rating',
        },
    },
}

/**
 * Custom hook to generate Highcharts options for a rating distribution chart.
 *
 * @param {UserStatsDistributionResponse['distribution']} ratingDistro - The rating distribution data.
 * @param {number | undefined} memberRating - The rating of the member (if available).
 * @returns {Highcharts.Options | undefined} - Highcharts options for the rating distribution
 * chart or undefined if data is empty.
 */
export function useRatingDistroOptions(
    ratingDistro: UserStatsDistributionResponse['distribution'],
    memberRating: number | undefined,
): Highcharts.Options | undefined {
    // Memoized Highcharts options to optimize performance
    const ratingDistributionOptions: Highcharts.Options | undefined = useMemo(() => {
        // Deep clone of the default chart configuration
        const options: Highcharts.Options = cloneDeep(RATING_DISTRO_CHART_CONFIG)

        // Get non-zero rating ranges from the distribution data
        const ranges = getNonZeroRanges(getRanges(ratingDistro))

        // Return undefined if the rating distribution data is empty
        if (isEmpty(ratingDistro)) return undefined

        // Add annotation for the member's rating if available
        if (!!memberRating) {
            // Find the group that the member belongs to based on rating range
            const memberRatingGroup: string = ranges.find((d: TrackRange) => (
                memberRating >= d.start && memberRating <= d.end
            ))?.name || ''

            // Add annotation to the chart for the member's rating group
            options.annotations = [{
                labels: [{
                    point: memberRatingGroup,
                    text: `${memberRating}`,
                }],
            }]
        }

        // Configure series for the chart
        options.series = [{
            colorByPoint: true,
            colors: ranges.map(r => getRatingColor(r.start)),
            data: ranges.map(r => [r.value, r.name, `Rating Range: ${r.start}-${r.end}`]),
            keys: ['y', 'id', 'name'],
            type: 'column',
        }]

        return options
    }, [memberRating, ratingDistro])

    return ratingDistributionOptions
}
