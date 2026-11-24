import { PendingApprovalTimesheetApprover } from './PendingApprovalTimesheet.model'

/**
 * One assignment on the Pending Timesheet Submissions tab: an active assignment with nothing submitted
 * for the work period.
 */
export interface PendingSubmissionTimesheetRow {
    /** The engagement's current managers; empty when none is assigned. */
    approvers: PendingApprovalTimesheetApprover[]
    assigneeHandle: string
    assigneeId: string
    assignmentId: string
    engagementId: string
    engagementTitle: string
    id: string
    projectId: string
    /** YYYY-MM-DD; the requested period clipped to the assignment's own dates. */
    workPeriodEnd: string
    /** YYYY-MM-DD; the requested period clipped to the assignment's own dates. */
    workPeriodStart: string
}

export interface PendingSubmissionTimesheetQuery {
    engagement?: string
    /** Leaves out the test projects the API is configured with. */
    excludeTestProjects?: boolean
    /** YYYY-MM-DD; required by the API. */
    fromDate: string
    /** Only engagements with at least one manager assigned. */
    managerAssigned?: boolean
    page?: number
    perPage?: number
    /** YYYY-MM-DD; required by the API. */
    toDate: string
}

export interface PendingSubmissionTimesheetListResponse {
    data: PendingSubmissionTimesheetRow[]
    meta: {
        page: number
        perPage: number
        totalCount: number
        totalPages: number
    }
}

export interface PendingSubmissionReminderResult {
    recipients: Array<{ assignmentId: string, handle: string, sent: boolean, userId: string }>
    sentCount: number
    skippedAssignmentIds: string[]
}
