import { Skill } from './Skill.model'

export type EngagementRole = 'CONTRACT' | 'FULL_TIME' | 'PART_TIME'

export type EngagementWorkload = 'FULL_TIME' | 'PART_TIME'

export type EngagementAnticipatedStart = 'FEW_DAYS' | 'FEW_WEEKS' | 'IMMEDIATE'

export type EngagementStatus = 'Active' | 'Cancelled' | 'Closed' | 'Open' | 'Pending Assignment'

export type ApplicationStatus = 'REJECTED' | 'SELECTED' | 'SUBMITTED' | 'UNDER_REVIEW'

export type AssignmentStatus = 'ACTIVE' | 'ASSIGNED' | 'TERMINATED'

export interface Assignment {
    endDate: string
    engagementId: number | string
    id: number | string
    memberHandle: string
    memberId: number | string
    otherRemarks: string
    startDate: string
    status: AssignmentStatus | string
    termsAccepted: boolean
    agreementRate: string
}

export interface Application {
    availability: string
    coverLetter?: string
    createdAt: string
    email: string
    engagementId: number | string
    handle: string
    id: number | string
    name: string
    status: ApplicationStatus | string
    updatedAt?: string
    userId: number | string
    yearsOfExperience: number
}

export interface Engagement {
    anticipatedStart: EngagementAnticipatedStart | string
    applications?: Application[]
    applicationsCount?: number
    assignedMemberHandles: string[]
    assignments: Assignment[]
    compensationRange: string
    countries: string[]
    createdAt: string
    description: string
    durationWeeks: number
    id: number | string
    isPrivate: boolean
    projectId: number | string
    requiredMemberCount: number
    role: EngagementRole | string
    skills: Skill[]
    status: EngagementStatus | string
    timezones: string[]
    title: string
    updatedAt: string
    workload: EngagementWorkload | string
}

export interface EngagementFilters {
    countries?: string[]
    includePrivate?: boolean
    page?: number
    perPage?: number
    projectId?: number | string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    status?: string
    timezones?: string[]
    title?: string
}

export interface AssignmentPayment {
    amount?: number
    attributes?: {
        remarks?: string
    }
    createdAt?: string
    description?: string
    details?: Array<{
        amount?: number
        grossAmount?: number
        totalAmount?: number
    }>
    id?: number | string
    paymentId?: number | string
    status?: string
    title?: string
    updatedAt?: string
}
