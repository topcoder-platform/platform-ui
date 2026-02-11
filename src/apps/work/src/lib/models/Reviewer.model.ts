export interface Reviewer {
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
    id: string
    name: string
    phaseId?: string
    track?: string
    trackId?: string
    typeId?: string
}

export interface Workflow {
    id: string
    name: string
}

export interface DefaultReviewer {
    phaseId?: string
    roleId?: string
}

export interface ScorecardFilters {
    abbreviation?: string
    perPage?: number
    page?: number
    track?: string
    typeId?: string
}
