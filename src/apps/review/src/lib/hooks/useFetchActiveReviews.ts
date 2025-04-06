/**
 * Fetch active review info
 */

import { useCallback, useState } from 'react'

import { ChallengeInfo } from '../models'
import { fetchActiveReviews } from '../services'

export interface useFetchActiveReviewsProps {
    activeReviews: ChallengeInfo[]
    loadActiveReviews: (challengeType: string) => void
}

/**
 * Fetch active reviews
 * @returns active reviews
 */
export function useFetchActiveReviews(): useFetchActiveReviewsProps {
    const [activeReviews, setActiveReviews] = useState<ChallengeInfo[]>([])
    const loadActiveReviews = useCallback((challengeType: string) => {
        fetchActiveReviews(challengeType)
            .then(results => {
                setActiveReviews(results)
            })
    }, [])

    return {
        activeReviews,
        loadActiveReviews,
    }
}
