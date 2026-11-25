import type { ChallengeReviewSummation } from '~/apps/opportunities/src/models'

/**
 * Model for submission review summation info
 */
export interface SubmissionReviewSummation extends ChallengeReviewSummation {
    aggregateScore: number
    id: string
    createdAt: string
    submissionId: string
    memberId?: string | number | null
    submitterId?: number | null
    submitterHandle?: string | null
    submitterMaxRating?: number | null
}
