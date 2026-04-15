import { Skill } from './Skill.model'

export type EngagementRole = 'DESIGNER' | 'SOFTWARE_DEVELOPER' | 'DATA_SCIENTIST' | 'DATA_ENGINEER'

export type EngagementWorkload = 'FULL_TIME' | 'FRACTIONAL'

export type EngagementAnticipatedStart = 'FEW_DAYS' | 'FEW_WEEKS' | 'IMMEDIATE'

export type EngagementStatus =
    'Active'
    | 'Cancelled'
    | 'Closed'
    | 'On Hold'
    | 'Open'
    | 'Pending Assignment'

export type ApplicationStatus = 'REJECTED' | 'SELECTED' | 'SUBMITTED' | 'UNDER_REVIEW'

export type AssignmentStatus = 'ACTIVE' | 'ASSIGNED' | 'COMPLETED' | 'TERMINATED'

export interface Assignment {
    agreementRate: string
    durationMonths?: number | string
    endDate: string
    engagementId: number | string
    id: number | string
    memberHandle: string
    memberId: number | string
    otherRemarks: string
    ratePerHour?: string
    startDate: string
    standardHoursPerWeek?: number | string
    status: AssignmentStatus | string
    terminationReason?: string
    termsAccepted: boolean
}

export interface Application {
    address?: string
    availability: string
    coverLetter?: string
    createdAt: string
    email: string
    engagementId: number | string
    handle: string
    id: number | string
    mobileNumber?: string
    name: string
    portfolioUrls?: string[]
    resumeUrl?: string
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
    project?: {
        id?: number | string
        name?: string
    }
    projectId: number | string
    projectName?: string
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
    projectIds?: Array<number | string>
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    status?: string
    timezones?: string[]
    title?: string
}

export interface AssignmentPayment {
    amount?: number
    attributes?: {
        agreementRate?: number | string
        hoursWorked?: number | string
        remarks?: string
    }
    createdBy?: string
    createdByHandle?: string
    createdAt?: string
    description?: string
    details?: Array<{
        amount?: number
        grossAmount?: number
        hoursWorked?: number | string
        totalAmount?: number
    }>
    hoursWorked?: number | string
    id?: number | string
    paymentId?: number | string
    status?: string
    title?: string
    updatedAt?: string
}
