import { useMemo } from 'react'

import { TCACertificationCompletionTimeRange } from '../data-providers'

type useHoursEstimateToRangeFn = (hoursEstimate: number) => TCACertificationCompletionTimeRange

export const useHoursEstimateToRange: useHoursEstimateToRangeFn
= (hoursEstimate: number): TCACertificationCompletionTimeRange => {

    const completionTimeRange: TCACertificationCompletionTimeRange = useMemo(() => ({
        highRangeValue: hoursEstimate,
        lowRangeValue: Math.ceil(hoursEstimate * (1 / 3)),
        units: 'hours',
    }), [hoursEstimate])

    return completionTimeRange
}
