import { mutate } from 'swr'
import qs from 'qs'

import { getChallengeReviewKeys } from './reviewCacheRegistry'

/**
 * Confirmation text shown when reopening your own scorecard.
 */
export const REOPEN_MESSAGE_SELF = [
    'The scorecard will be reopened and you will be able to edit it before submitting the scorecard again.',
    'Are you sure you want to reopen the scorecard?',
].join(' ')

/**
 * Confirmation text shown when reopening someone else\'s scorecard.
 */
export const REOPEN_MESSAGE_OTHER = [
    'The scorecard will be reopened and the reviewer will be able to edit it before submitting the scorecard again.',
    'Are you sure you want to reopen the scorecard?',
].join(' ')

/**
 * Revalidate SWR caches related to challenge reviews and submissions after a reopen action.
 */
export const refreshChallengeReviewData = async (challengeId?: string): Promise<void> => {
    if (!challengeId) {
        return
    }

    const registeredReviewKeys = getChallengeReviewKeys(challengeId)
    const reviewListKey = `reviewBaseUrl/reviews?${qs.stringify({
        challengeId,
        page: 1,
        perPage: 1000,
    })}`

    const keysToRevalidate = new Set<string>([
        ...registeredReviewKeys,
        reviewListKey,
        `reviewBaseUrl/challengeReviews/${challengeId}`,
        `reviewBaseUrl/submissions/${challengeId}`,
        `challengeBaseUrl/challenges/${challengeId}`,
    ])

    await Promise.all(Array.from(keysToRevalidate)
        .map(key => mutate(key)))
}
