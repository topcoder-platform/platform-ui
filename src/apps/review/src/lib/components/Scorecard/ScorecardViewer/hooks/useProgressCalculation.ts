import { useCallback, useEffect, useState } from 'react'
import { UseFormReturn, useWatch } from 'react-hook-form'

import { FormReviews, Scorecard, ScorecardInfo } from '../../../../models'
import { calculateProgressAndScore, ProgressAndScore } from '../utils'

interface UseProgressCalculationProps {
    form?: UseFormReturn<FormReviews>
    scorecard: Scorecard | ScorecardInfo
}

export interface UseProgressCalculationValue {
    totalScore: number
    reviewProgress: number
    recalculateReviewProgress: () => void
}

export const useProgressCalculation = ({
    form,
    scorecard,
}: UseProgressCalculationProps): UseProgressCalculationValue => {
    const [reviewProgress, setReviewProgress] = useState(0)
    const [totalScore, setTotalScore] = useState(0)

    // Watch form values to automatically recalculate progress
    const watchedReviews = useWatch({
        control: form?.control,
        name: 'reviews',
    })

    // Recalculate progress when form values change
    useEffect(() => {
        if (!form || !scorecard) {
            return
        }

        const reviewFormDatas = watchedReviews ?? form.getValues().reviews
        const { progress, score }: ProgressAndScore = calculateProgressAndScore(reviewFormDatas, scorecard)
        setReviewProgress(progress)
        setTotalScore(score)
    }, [watchedReviews, form, scorecard])

    const recalculateReviewProgress = useCallback(() => {
        if (!form || !scorecard) {
            return
        }

        const reviewFormDatas = form.getValues().reviews
        const { progress, score }: ProgressAndScore = calculateProgressAndScore(reviewFormDatas, scorecard)
        setReviewProgress(progress)
        setTotalScore(score)
    }, [form, scorecard])

    return {
        recalculateReviewProgress,
        reviewProgress,
        totalScore,
    }
}
