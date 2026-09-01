export type OpportunityKind = 'competitions' | 'engagements' | 'copilots' | 'reviews'

/** Member-selected presentation for an Opportunities result page. */
export type OpportunityView = 'list' | 'grid'

/** Lifecycle facet shared by the mixed My Work result set. */
export type OpportunityWorkStatus = 'all' | 'active' | 'past'

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

/** Catalog value returned by Challenge API reference expansions. */
export interface ChallengeCatalogEntry {
    id?: string
    name?: string
    track?: string
}

/** Challenge catalog value accepted from current and legacy API responses. */
export type ChallengeCatalogValue = string | ChallengeCatalogEntry

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

/** Aggregate challenge values calculated by Challenge API. */
export interface ChallengeOverview {
    totalPrizes?: number
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

export interface ChallengeAttachment {
    description?: string
    fileSize?: number
    id: string
    name?: string
    url?: string
}

export interface ChallengeDiscussion {
    id?: string
    name?: string
    provider?: string
    type?: string
    url?: string
}

export interface ChallengeLegacy {
    forumId?: number
    reviewScorecardId?: number
    screeningScorecardId?: number
}

export interface ChallengeMetadata {
    name: string
    value: unknown
}

export interface ChallengeOpportunity {
    attachments?: ChallengeAttachment[]
    currentPhase?: ChallengePhase
    currentPhaseNames?: string[]
    description?: string
    descriptionFormat?: string
    discussions?: ChallengeDiscussion[]
    endDate?: string
    events?: Array<{ key?: string; name?: string }>
    forumId?: number
    funChallenge?: boolean
    id: string
    legacyId?: number
    legacy?: ChallengeLegacy
    metadata?: ChallengeMetadata[]
    name: string
    numOfPosts?: number
    numOfRegistrants?: number
    numOfSubmissions?: number
    overview?: ChallengeOverview
    phases?: ChallengePhase[]
    privateDescription?: string
    prizeSets?: ChallengePrizeSet[]
    projectId?: string
    registrationEndDate?: string
    skills?: OpportunitySkill[]
    startDate?: string
    status?: string
    tags?: string[]
    terms?: ChallengeTerm[]
    track?: ChallengeCatalogValue
    type?: ChallengeCatalogValue
    winners?: Array<{
        handle?: string
        placement?: number
        prize?: number
        userId?: string
    }>
}

export interface ChallengeResource {
    challengeId?: string
    created?: string
    id: string
    memberHandle?: string
    memberId?: number | string
    rating?: number
    roleId?: string
}

export interface ChallengeResourceRole {
    id: string
    name: string
}

export interface EngagementOpportunity {
    applicationStatus?: string
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
    myApplication?: { status?: string }
    nanoId?: string
    requiredSkills?: string[]
    role?: string
    skills?: OpportunitySkill[]
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
    role?: string
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

/** Review API aggregate score attached to a Marathon Match submission. */
export interface ChallengeReviewSummation {
    aggregateScore?: number | string | null
    created?: string
    createdAt?: string
    id?: string
    isExample?: boolean | null
    isFinal?: boolean | null
    isPassing?: boolean | null
    isProvisional?: boolean | null
    is_example?: boolean | null
    is_final?: boolean | null
    is_provisional?: boolean | null
    memberId?: number | string | null
    metadata?: Record<string, unknown> | null
    reviewedDate?: string
    submissionId?: string
    submitterHandle?: string | null
    submitterId?: number | string | null
    submitterMaxRating?: number | null
    type?: string
    updatedAt?: string
}

/** Canonical Review API result for one final-placement challenge winner. */
export interface ChallengeProjectResult {
    challengeId?: string
    finalScore?: number | string | null
    initialScore?: number | string | null
    placement?: number | string | null
    submissionId?: string | null
    userId?: number | string | null
}

export interface ChallengeSubmission {
    challengeId?: string
    createdAt?: string
    createdBy?: string
    finalScore?: number | string | null
    id: string
    initialScore?: number | string | null
    isLatest?: boolean
    memberHandle?: string
    memberId?: string
    placement?: number
    previewUrl?: string
    provisionalScore?: number | string | null
    rating?: number | null
    registrant?: {
        handle?: string
        memberHandle?: string
        userId?: string
    }
    review?: Array<{
        finalScore?: number | string | null
        initialScore?: number | string | null
        score?: number | string | null
        status?: string
    }>
    reviewSummation?: ChallengeReviewSummation[]
    reviewSummations?: ChallengeReviewSummation[]
    status?: string
    submissionCount?: number
    submittedDate?: string
    submitterHandle?: string
    submitterMaxRating?: number | null
    type?: string
}

/** Submission categories accepted by the v6 Review API upload endpoint. */
export type ChallengeSubmissionType =
    | 'CONTEST_SUBMISSION'
    | 'CHECKPOINT_SUBMISSION'
    | 'STUDIO_FINAL_FIX_SUBMISSION'
