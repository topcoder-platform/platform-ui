/**
 * Fetch review
 */

import { useCallback, useState } from 'react'

import { useOnComponentDidMount } from '~/apps/admin/src/lib/hooks'

import { AppealInfo, ReviewInfo, ScorecardInfo } from '../models'
import { fetchAppeals, fetchReviewInfo, fetchScorecards } from '../services'

export interface useFetchReviewsProps {
    scorecardInfo: ScorecardInfo | undefined
    reviewInfo: ReviewInfo | undefined
    appeals: AppealInfo[]
}

/**
 * Fetch review info
 * @param isEdit is in edit mode
 * @returns review info
 */
export function useFetchReviews(isEdit: boolean): useFetchReviewsProps {
    const [scorecardInfo, setScorecardInfo] = useState<ScorecardInfo>()
    const [reviewInfo, setReviewInfo] = useState<ReviewInfo>()
    const [appeals, setAppeals] = useState<AppealInfo[]>([])
    const loadScorecard = useCallback(() => {
        fetchScorecards()
            .then(result => {
                setScorecardInfo(result)
            })
    }, [])
    const loadAppeals = useCallback(() => {
        fetchAppeals()
            .then(results => {
                setAppeals(results)
            })
    }, [])
    const loadReviewInfo = useCallback(() => {
        fetchReviewInfo(isEdit)
            .then(result => {
                setReviewInfo(result)
            })
    }, [isEdit])

    useOnComponentDidMount(() => {
        loadScorecard()
        loadAppeals()
        loadReviewInfo()
    })

    return {
        appeals,
        reviewInfo,
        scorecardInfo,
    }
}
