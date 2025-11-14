import { useCallback, useMemo } from 'react'
import { UseFormReturn, useWatch } from 'react-hook-form'

import { FormReviews, Scorecard, ScorecardInfo } from '../../../../models'
import { calculateProgressAndScore, ProgressAndScore } from '../utils'

interface UseProgressCalculationProps {
    form?: UseFormReturn<FormReviews>
    scorecard: Scorecard | ScorecardInfo
}

export interface UseProgressCalculationValue extends ProgressAndScore {
    recalculateReviewProgress: () => void
}

export const useProgressCalculation = ({
    form,
    scorecard,
}: UseProgressCalculationProps): UseProgressCalculationValue => {
    // Watch form values to automatically recalculate progress
    const watchedReviews = useWatch({
        control: form?.control,
        name: 'reviews',
    })

    const recalculateReviewProgress = useCallback(() => {
        const reviewFormDatas = form?.getValues()?.reviews ?? []
        return calculateProgressAndScore(reviewFormDatas, scorecard)
    }, [form, scorecard])

    return useMemo(() => ({
        ...recalculateReviewProgress(),
        recalculateReviewProgress,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [watchedReviews, recalculateReviewProgress])
}
