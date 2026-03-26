export interface Reviewer {
    additionalMemberIds?: string[]
    aiWorkflowId?: string
    baseCoefficient?: number
    handle?: string
    incrementalCoefficient?: number
    isMemberReview?: boolean
    memberId?: string
    memberReviewerCount?: number
    phaseId?: string
    resourceId?: string
    roleId?: string
    scorecardId?: string
    shouldOpenOpportunity?: boolean
}

export interface Scorecard {
    challengeTrack?: string
    challengeType?: string
    id: string
    name: string
    phaseId?: string
    status?: string
    type?: string
    track?: string
    trackId?: string
    typeId?: string
    version?: string
}

export interface Workflow {
    id: string
    name: string
    scorecardId?: string
}

export interface DefaultReviewer {
    aiWorkflowId?: string
    baseCoefficient?: number
    incrementalCoefficient?: number
    isMemberReview?: boolean
    memberReviewerCount?: number
    phaseId?: string
    roleId?: string
    scorecardId?: string
}

export interface ScorecardFilters {
    abbreviation?: string
    challengeTrack?: string
    challengeType?: string
    perPage?: number
    page?: number
    status?: string
    track?: string
    typeId?: string
}
