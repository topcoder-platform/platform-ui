export enum EngagementStatus {
    OPEN = 'open',
    PENDING_ASSIGNMENT = 'pending_assignment',
    CLOSED = 'closed',
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
    applicationDeadline: string
    status: EngagementStatus
    createdAt: string
    updatedAt: string
    createdBy: string
}

export interface EngagementListResponse {
    data: Engagement[]
    total: number
    page: number
    perPage: number
    totalPages: number
}
