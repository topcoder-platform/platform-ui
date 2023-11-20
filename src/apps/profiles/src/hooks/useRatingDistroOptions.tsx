import { useMemo } from 'react'
import { isEmpty, toPairs } from 'lodash'
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

export const RATING_DISTRO_CHART_CONFIG: Highcharts.Options = {
    chart: {
        type: 'column',
    },
    credits: {
        enabled: false,
    },
    legend: {
        enabled: false,
    },
    plotOptions: {
        column: {
            dataLabels: {
                enabled: false,
            },
            groupPadding: 0.025,
            minPointLength: 5,
            pointPadding: 0,
        },
    },
    title: {
        text: 'RATING DISTRIBUTION',
    },
    tooltip: {
        pointFormat: '{point.y:.0f} Coders',
    },
    xAxis: {
        visible: false,
    },
    yAxis: {
        title: {
            text: 'Rating',
        },
    },
}

export function useRatingDistroOptions(
    ratingDistro: UserStatsDistributionResponse['distribution'],
    memberRating: number | undefined,
): Highcharts.Options | undefined {
    const ratingDistributionOptions: Highcharts.Options | undefined = useMemo(() => {
        const options: Highcharts.Options = RATING_DISTRO_CHART_CONFIG
        const ranges = getNonZeroRanges(getRanges(ratingDistro))

        if (isEmpty(ratingDistro)) return undefined

        if (!!memberRating) {
            // if member is defined, find the group that the member belongs to
            // and add an annotation to the chart
            const memberRatingGroup: string = ranges.find((d: TrackRange) => (
                memberRating >= d.start && memberRating <= d.end
            ))?.name || ''

            options.annotations = [{
                labels: [{
                    point: memberRatingGroup,
                    text: `${memberRating}`,
                }],
            }]
        }

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
