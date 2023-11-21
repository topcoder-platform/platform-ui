import { useMemo } from 'react'
import { cloneDeep, get } from 'lodash'
import Highcharts from 'highcharts'

import { StatsHistory } from '~/libs/core'

export const RATING_CHART_CONFIG: Highcharts.Options = {
    credits: {
        enabled: false,
    },
    title: {
        text: 'RATING HISTORY',
    },
    tooltip: {
        pointFormat: '{point.x:%Y-%m-%d}: {point.y:.0f}',
    },
    xAxis: {
        labels: {
            format: '{value:%Y-%m-%d}',
        },
        type: 'datetime',
    },
    yAxis: {
        title: {
            text: 'Rating',
        },
    },
}

export function useRatingHistoryOptions(
    trackHistory: Array<StatsHistory> | undefined,
    seriesName: string,
): Highcharts.Options | undefined {
    const ratingHistoryOptions: Highcharts.Options | undefined = useMemo(() => {
        const options: Highcharts.Options = cloneDeep(RATING_CHART_CONFIG)

        if (!trackHistory?.length) return undefined

        const dateField: string = get(trackHistory[0], 'date') ? 'date' : 'ratingDate'
        const ratingField: string = get(trackHistory[0], 'rating') ? 'rating' : 'newRating'

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
