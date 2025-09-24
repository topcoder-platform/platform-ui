/**
 * Util for challenge
 */

import { ChallengeInfo } from '../models'

/**
 * Check if challenge is in the review phase
 * @param challengeInfo challenge info
 * @returns true if challenge is in the review phase
 */
export function isReviewPhase(challengeInfo?: ChallengeInfo): boolean {
    return (challengeInfo?.currentPhase ?? '').indexOf('Review') >= 0
}

/**
 * Check if challenge is in the appeals phase
 * @param challengeInfo challenge info
 * @returns true if challenge is in the appeals phase
 */
export function isAppealsPhase(challengeInfo?: ChallengeInfo): boolean {
    return challengeInfo?.currentPhase === 'Appeals'
}

/**
 * Check if challenge is in the appeals response phase
 * @param challengeInfo challenge info
 * @returns true if challenge is in the appeals response phase
 */
export function isAppealsResponsePhase(challengeInfo?: ChallengeInfo): boolean {
    return challengeInfo?.currentPhase === 'Appeals Response'
}
