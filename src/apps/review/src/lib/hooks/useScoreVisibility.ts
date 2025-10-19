import { useCallback, useMemo } from 'react'

import type { SubmissionRow } from '../components/common/types'
import type { ChallengeInfo } from '../models'
import { PAST_CHALLENGE_STATUSES } from '../utils/challengeStatus'

interface UseScoreVisibilityParams {
    challengeInfo?: ChallengeInfo
    allowsAppeals: boolean
    isAppealsWindowOpen: boolean
    isFirst2FinishChallenge: boolean
    isStandardChallenge: boolean
}

/**
 * Centralises score-visibility rules for submitters based on challenge configuration.
 */
export function useScoreVisibility({
    challengeInfo,
    allowsAppeals,
    isAppealsWindowOpen,
    isFirst2FinishChallenge,
    isStandardChallenge,
}: UseScoreVisibilityParams) {
    const normalizedStatus = useMemo(
        () => (challengeInfo?.status ?? '').trim().toUpperCase(),
        [challengeInfo?.status],
    )

    const isPastChallengeStatus = useMemo(
        () => PAST_CHALLENGE_STATUSES.some(status => status === normalizedStatus),
        [normalizedStatus],
    )

    const isChallengeCompleted = useMemo(
        () => normalizedStatus === 'COMPLETED',
        [normalizedStatus],
    )

    const canDisplayScores = useCallback((submission: SubmissionRow): boolean => {
        if (isPastChallengeStatus) {
            return true
        }

        if (isChallengeCompleted) {
            return true
        }

        const reviews = submission.aggregated?.reviews ?? []
        const allReviewsCompleted = reviews.length > 0
            && reviews.every(review => {
                const status = (review.reviewInfo?.status ?? '').toUpperCase()
                const committed = review.reviewInfo?.committed ?? false

                return committed || status === 'COMPLETED' || status === 'SUBMITTED'
            })

        if (isFirst2FinishChallenge) {
            return allReviewsCompleted
        }

        if (isStandardChallenge) {
            if (allowsAppeals) {
                return isAppealsWindowOpen
            }

            return allReviewsCompleted
        }

        return true
    }, [
        allowsAppeals,
        isAppealsWindowOpen,
        isChallengeCompleted,
        isFirst2FinishChallenge,
        isPastChallengeStatus,
        isStandardChallenge,
    ])

    return {
        canDisplayScores,
        isChallengeCompleted,
        isPastChallengeStatus,
    }
}
