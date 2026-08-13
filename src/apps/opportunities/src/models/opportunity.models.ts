export type OpportunityKind = 'competitions' | 'engagements' | 'copilots' | 'reviews'

export interface OpportunityCellSummary {
    count: number
    amount?: number
    amountLabel?: string
    tag?: string
}

export type OpportunitySummary = Record<OpportunityKind, OpportunityCellSummary>

export interface OpportunitySkill {
    id?: string | number
    name: string
}

export interface ChallengePhase {
    actualEndDate?: string
    actualStartDate?: string
    duration?: number
    id?: string
    isOpen?: boolean
    name: string
    scheduledEndDate?: string
    scheduledStartDate?: string
}

export interface ChallengePrize {
    type?: string
    value?: number
}

export interface ChallengePrizeSet {
    prizes?: ChallengePrize[]
    type?: string
}

export interface ChallengeTerm {
    agreed?: boolean
    agreeabilityType?: string
    docusignTemplateId?: string | number
    id?: string
    roleId?: string
    text?: string
    title?: string
    url?: string
}

export interface ChallengeOpportunity {
    description?: string
    endDate?: string
    events?: Array<{ key?: string; name?: string }>
    forumId?: number
    id: string
    legacyId?: number
    name: string
    numOfRegistrants?: number
    numOfSubmissions?: number
    overview?: string
    overviewTotalPrizes?: number
    phases?: ChallengePhase[]
    prizeSets?: ChallengePrizeSet[]
    projectId?: string
    registrationEndDate?: string
    skills?: OpportunitySkill[]
    startDate?: string
    status?: string
    tags?: string[]
    terms?: ChallengeTerm[]
    track?: string | { id?: string; name?: string }
    type?: string | { id?: string; name?: string }
    winners?: Array<{
        handle?: string
        placement?: number
        prize?: number
        userId?: string
    }>
}

export interface ChallengeResource {
    challengeId?: string
    id: string
    memberHandle?: string
    memberId?: string
    roleId?: string
}

export interface ChallengeResourceRole {
    id: string
    name: string
}

export interface EngagementOpportunity {
    anticipatedStart?: 'IMMEDIATE' | 'FEW_DAYS' | 'FEW_WEEKS' | string
    compensationRange?: string
    countries?: string[]
    description?: string
    duration?: {
        endDate?: string
        lengthInMonths?: number
        lengthInWeeks?: number
        startDate?: string
    }
    durationEndDate?: string
    durationMonths?: number
    durationStartDate?: string
    durationWeeks?: number
    id: string
    nanoId?: string
    requiredSkills?: string[]
    role?: string
    status?: string
    timeZones?: string[]
    title: string
    workload?: string
}

export interface CopilotApplicationSummary {
    createdAt: string
    id: string
    status: string
    updatedAt: string
}

export interface CopilotOpportunity {
    canApplyAsCopilot?: boolean
    complexity?: string
    createdAt?: string
    currentUserApplication?: CopilotApplicationSummary
    hasApplied?: boolean
    id: string
    numHoursPerWeek?: number
    numWeeks?: number
    opportunityTitle?: string
    otherPaymentType?: string
    overview?: string
    paymentType?: string
    project?: { name?: string }
    projectName?: string
    projectType?: string
    skills?: OpportunitySkill[]
    startDate?: string
    status?: string
    type?: string
}

export interface ReviewApplicationSummary {
    applicationDate?: string
    createdAt?: string
    handle?: string
    id?: string
    latestCompletedReviews?: number
    openReviews?: number
    role?: string
    status?: string
    userHandle?: string
    userId?: string
}

export interface ReviewPayment {
    payment: number
    role: string
    roleId: number
}

export interface ReviewOpportunity {
    applicationCount?: number
    applicationRoles?: string[]
    applications?: ReviewApplicationSummary[]
    approvedApplicationCount?: number
    basePayment?: number
    canApply?: boolean
    canApplyReason?: string
    challengeData?: Record<string, any>
    challengeId: string
    challengeName?: string
    duration?: number
    defaultApplicationRole?: string
    id: string
    incrementalPayment?: number
    myApplications?: ReviewApplicationSummary[]
    openPositions?: number
    payments?: ReviewPayment[]
    remainingPositions?: number
    requirements?: string
    reviewRequirements?: string
    startDate?: string
    status?: string
    submissions?: number
    type?: string
}

export type OpportunityItem = ChallengeOpportunity | EngagementOpportunity | CopilotOpportunity | ReviewOpportunity

export interface OpportunityPage<T> {
    items: T[]
    page: number
    perPage: number
    total: number
    totalPages: number
}

export interface OpportunityFilters {
    applied?: boolean
    memberId?: string
    page: number
    perPage: number
    resourceRoleId?: string
    search?: string
    skills?: string[]
    sort?: string
    statuses?: string[]
    tracks?: string[]
    types?: string[]
}

export interface ApiEnvelope<T> {
    content?: T
    metadata?: Record<string, any>
    result?: {
        content?: T
        metadata?: Record<string, any>
    }
}

/** Paginated list shape used by domain APIs that do not use the standard envelope. */
export interface ApiListResponse<T> {
    data?: T[]
    meta?: {
        limit?: number
        page?: number
        perPage?: number
        total?: number
        totalCount?: number
        totalPages?: number
    }
}

export interface ChallengeSubmission {
    createdAt?: string
    createdBy?: string
    id: string
    memberHandle?: string
    memberId?: string
    previewUrl?: string
    registrant?: {
        handle?: string
        memberHandle?: string
        userId?: string
    }
    submittedDate?: string
    submitterHandle?: string
    type?: string
}
