export type ChallengeReviewContextStatus = 'AI_GENERATED' | 'HUMAN_APPROVED' | 'HUMAN_REJECTED'

export interface ChallengeReviewContext {
    id: string
    challengeId: string
    context: Record<string, unknown>
    status: ChallengeReviewContextStatus
    createdAt?: string
    createdBy?: string | null
    updatedAt?: string
    updatedBy?: string | null
}
