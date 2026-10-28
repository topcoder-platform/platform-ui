/**
 * One approval on the Approved Timesheets tab: the unpaid entries one approver approved together on
 * one assignment.
 */
export interface ApprovedTimesheetRow {
    agreementRate: string | null
    approvalComment: string | null
    approvedAt: string
    approvedBy: string | null
    approvedByHandle: string | null
    approvedByName: string | null
    assigneeHandle: string
    assigneeId: string
    assignmentId: string
    engagementId: string
    engagementTitle: string
    /** The approved, unpaid entries a payment for this row consumes. */
    entryIds: string[]
    /** Approved, unpaid hours in this approval. */
    hours: number
    /** Assignment total hours minus processed payment hours; null without a total or when unavailable. */
    hoursLeft: number | null
    id: string
    paymentCycle: string
    projectId: string
    projectName: string | null
    ratePerHour: string | null
    standardHoursPerDay: number | null
    standardHoursPerWeek: number | null
    /** YYYY-MM-DD */
    workPeriodEnd: string
    /** YYYY-MM-DD */
    workPeriodStart: string
}

export interface ApprovedTimesheetQuery {
    assignee?: string
    engagement?: string
    /** Leaves out the test projects the API is configured with. */
    excludeTestProjects?: boolean
    page?: number
    perPage?: number
}

export interface ApprovedTimesheetListResponse {
    data: ApprovedTimesheetRow[]
    meta: {
        page: number
        perPage: number
        totalCount: number
        totalPages: number
    }
}
