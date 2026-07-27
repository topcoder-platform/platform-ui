export type ChallengeReviewContextStatus = 'AI_GENERATED' | 'HUMAN_APPROVED' | 'HUMAN_REJECTED'

export interface ReviewContextPrize {
    value: number
    currency: string
    placement: number
}

export interface ReviewContextSkill {
    id: string
    name: string
}

export interface ReviewContextTimeline {
    endDate: string
    startDate: string
    totalDurationDays: number
    registrationEndDate: string
    registrationStartDate: string
}

export interface ReviewContextConstraint {
    id: string
    text: string
}

export interface ReviewContextRequirement {
    id: string
    title: string
    priority: string
    constraints: ReviewContextConstraint[]
    description: string
}

export interface ChallengeReviewContextData {
    title: string
    prizes: ReviewContextPrize[]
    skills: ReviewContextSkill[]
    timeline: ReviewContextTimeline
    tech_stack: string[]
    challengeId: string
    requirements: ReviewContextRequirement[]
    descriptionRaw: string
    descriptionFormat?: string
    review_criteria?: Record<string, unknown>
    existing_codebase?: Record<string, unknown>
    challenge_metadata?: Record<string, unknown>
    requirement_groups?: Record<string, unknown>[]
    runtime_environment?: Record<string, unknown>
    submission_guidelines?: Record<string, unknown>
    [key: string]: unknown
}

export interface ChallengeReviewContext {
    id: string
    challengeId: string
    context: ChallengeReviewContextData
    status: ChallengeReviewContextStatus
    createdAt?: string
    createdBy?: string | null
    updatedAt?: string
    updatedBy?: string | null
}
