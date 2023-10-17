import { useMemo } from 'react'
import { get } from 'lodash'
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
    dateField: string = 'ratingDate',
    ratingField: string = 'newRating',
): Highcharts.Options | undefined {
    const ratingHistoryOptions: Highcharts.Options | undefined = useMemo(() => {
        const options: Highcharts.Options = RATING_CHART_CONFIG

        if (!trackHistory?.length) return undefined

        options.series = [{
            data: trackHistory.sort((a, b) => get(b, dateField) - get(a, dateField))
                .map((hisChallenge: StatsHistory) => ({
                    name: hisChallenge.challengeName,
                    x: get(hisChallenge, dateField),
                    y: get(hisChallenge, ratingField),
                })),
            name: seriesName,
            type: 'spline',
        }]

        return options
    }, [dateField, ratingField, seriesName, trackHistory])

    return ratingHistoryOptions
}