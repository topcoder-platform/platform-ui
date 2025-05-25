import { Submission } from './Submission.model'

/**
 * Model for member submissions info
 */
export interface MemberSubmission {
    submissions: Submission[]
    memberId: number
    provisionalRank: number | undefined
    finalRank: number | undefined
}
