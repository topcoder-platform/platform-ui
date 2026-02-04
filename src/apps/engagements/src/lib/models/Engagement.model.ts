export enum EngagementStatus {
    OPEN = 'open',
    PENDING_ASSIGNMENT = 'pending_assignment',
    ACTIVE = 'active',
    CANCELLED = 'cancelled',
    CLOSED = 'closed',
}

export interface EngagementAssignment {
    id: string
    engagementId: string
    memberId: string
    memberHandle: string
    status?: string
    termsAccepted?: boolean
    agreementRate?: string
    otherRemarks?: string
    startDate?: string
    endDate?: string
    terminationReason?: string
    createdAt: string
    updatedAt: string
}

export interface Engagement {
    id: string
    nanoId: string
    projectId: string
    title: string
    description: string
    duration: {
        startDate?: string
        endDate?: string
        lengthInWeeks?: number
        lengthInMonths?: number
    }
    timeZones: string[]
    countries: string[]
    requiredSkills: string[]
    anticipatedStart?: string
    status: EngagementStatus
    createdAt: string
    updatedAt: string
    createdBy: string
    createdByEmail?: string
    assignments?: EngagementAssignment[]
    isPrivate?: boolean
    requiredMemberCount?: number
    role?: string
    workload?: string
    compensationRange?: string
}

export interface EngagementListResponse {
    data: Engagement[]
    total: number
    page: number
    perPage: number
    totalPages: number
}
