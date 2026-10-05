import { Skill } from './Skill.model'

export type EngagementRole = 'DESIGNER' | 'SOFTWARE_DEVELOPER' | 'DATA_SCIENTIST' | 'DATA_ENGINEER'

export type EngagementRoleLevel = 'JUNIOR' | 'MID' | 'SENIOR'

export type EngagementWorkload = 'FULL_TIME' | 'FRACTIONAL'

export type EngagementAnticipatedStart = 'FEW_DAYS' | 'FEW_WEEKS' | 'IMMEDIATE'

export type EngagementStatus =
    'Active'
    | 'Cancelled'
    | 'Closed'
    | 'On Hold'
    | 'Open'
    | 'Pending Assignment'

export type ApplicationStatus = 'REJECTED' | 'SELECTED' | 'SHORTLISTED' | 'SUBMITTED' | 'UNDER_REVIEW'

export type AssignmentStatus = 'ACTIVE' | 'ASSIGNED' | 'COMPLETED' | 'OFFER_REJECTED' | 'SELECTED' | 'TERMINATED'

export type PaymentCycle = 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY'

export type AssignmentSource =
    | 'CUSTOMER_REFERRAL'
    | 'DIRECT'
    | 'TOPCODER_COMMUNITY'
    | 'VENDOR'
    | 'WIPRO_REFERRAL'

export interface Assignment {
    agreementRate: string
    candidateWiproId?: string
    durationMonths?: number | string
    endDate: string
    engagementId: number | string
    id: number | string
    memberHandle: string
    memberId: number | string
    otherRemarks: string
    paymentCycle?: PaymentCycle | string
    ratePerHour?: string
    source?: AssignmentSource | string
    startDate: string
    standardHoursPerDay?: number | string
    standardHoursPerWeek?: number | string
    status: AssignmentStatus | string
    terminationReason?: string
    termsAccepted: boolean
    wiproIdEndDate?: string
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

/**
 * A manager authorized to approve timesheets on an engagement.
 *
 * The list lives in the engagements API and is shared with the Engagements Portal: both apps read and
 * write the same endpoints, so a manager added in either one shows up in the other.
 */
export interface EngagementManager {
    handle: string
    name: string | null
    userId: string
}

/**
 * Identity of the member being granted approval authority.
 *
 * `userId` is the authoritative field - authority is keyed on it. `handle` and `name` are display
 * values the caller already has from the member picker, sent so the API does not have to look the
 * member up again.
 */
export interface AssignEngagementManagerPayload {
    handle?: string
    name?: string
    userId: string
}

export interface Engagement {
    account?: string
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
    managers?: EngagementManager[]
    project?: {
        id?: number | string
        name?: string
    }
    projectId: number | string
    projectName?: string
    receivedDateFromAccount?: string
    requiredMemberCount: number
    role: EngagementRole | string
    roleLevel?: EngagementRoleLevel | string
    skills: Skill[]
    smu?: string
    spoc?: string
    status: EngagementStatus | string
    timezones: string[]
    title: string
    updatedAt: string
    workload: EngagementWorkload | string
}

/**
 * Approved, unpaid hours available for a payment period.
 *
 * `totalHours` is an exact decimal string: it is multiplied by the hourly rate to produce money, so it
 * never travels as a float.
 */
export interface TimesheetPaymentSummary {
    alreadyPaidEntryIds: string[]
    entryIds: string[]
    ratePerHour: string | null
    totalDays: number
    totalHours: string
}

export interface TimesheetPaymentEntry {
    hoursWorked: string
    id: string
    paidAt: string
    paymentReference: string
    workDate: string
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
    status?: string | string[]
    timezones?: string[]
    title?: string
}

export interface AssignmentPayment {
    amount?: number
    attributes?: {
        agreementRate?: number | string
        assignmentId?: number | string
        hoursWorked?: number | string
        remarks?: string
        timesheetEntryIds?: string[]
    }
    billingAccountId?: number | string
    challengeFee?: number | string
    createdBy?: string
    createdByHandle?: string
    createdAt?: string
    datePaid?: string
    description?: string
    details?: Array<{
        amount?: number
        billingAccount?: number | string
        billingAccountName?: string
        challengeFee?: number | string
        datePaid?: string
        grossAmount?: number
        hoursWorked?: number | string
        releaseDate?: string
        totalAmount?: number
    }>
    hoursWorked?: number | string
    id?: number | string
    paymentId?: number | string
    paymentAmount?: number | string
    releaseDate?: string
    status?: string
    title?: string
    updatedAt?: string
}
