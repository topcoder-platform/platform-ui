import { ChallengeInfo } from './ChallengeInfo.model'

/**
 * Response for fetch active review
 */
export interface ResponseFetchActiveReviews {
    data: ChallengeInfo[]
    totalPages: number
}
