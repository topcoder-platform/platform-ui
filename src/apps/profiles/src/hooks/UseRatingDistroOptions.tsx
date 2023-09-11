import { useMemo } from 'react'
import { isEmpty, keys } from 'lodash'
import AnnotationsModule from 'highcharts/modules/annotations'
import Highcharts from 'highcharts'

import { UserStatsDistributionResponse } from '~/libs/core'

AnnotationsModule(Highcharts)

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
        const distroGroups = keys(ratingDistro)

        if (isEmpty(ratingDistro)) return undefined

        if (!!memberRating) {
            // if member is defined, find the group that the member belongs to
            // and add an annotation to the chart
            const memberRatingGroup: string = distroGroups.find((key: string) => {
                const [min, max] = key.split('ratingRange')[1].split('To')
                    .map((n: string) => parseInt(n, 10))
                return memberRating >= min && memberRating <= max
            }) || ''

            options.annotations = [{
                labels: [{
                    point: memberRatingGroup,
                    text: `${memberRating}`,
                }],
            }]
        }

        options.series = [{
            data: distroGroups
                .map((key: string) => [ratingDistro[key], key, key.split('ratingRange')[1]]),
            keys: ['y', 'id', 'name'],
            type: 'column',
        }]

        return options
    }, [memberRating, ratingDistro])

    return ratingDistributionOptions
}
