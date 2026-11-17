/** A manager who can approve a pending timesheet. */
export interface PendingApprovalTimesheetApprover {
    handle: string
    name: string | null
    userId: string
}

/**
 * One submission on the Pending Timesheet Approvals tab: the entries a member submitted together on
 * one assignment that are still waiting for approval.
 */
export interface PendingApprovalTimesheetRow {
    /** The engagement's current managers; empty when none is assigned. */
    approvers: PendingApprovalTimesheetApprover[]
    assigneeHandle: string
    assigneeId: string
    assignmentId: string
    engagementId: string
    engagementTitle: string
    entryIds: string[]
    hours: number
    id: string
    projectId: string
    submittedAt: string | null
    /** YYYY-MM-DD */
    workPeriodEnd: string
    /** YYYY-MM-DD */
    workPeriodStart: string
}

export interface PendingApprovalTimesheetQuery {
    engagement?: string
    /** Leaves out the test projects the API is configured with. */
    excludeTestProjects?: boolean
    /** YYYY-MM-DD */
    fromDate?: string
    page?: number
    perPage?: number
    /** YYYY-MM-DD */
    toDate?: string
}

export interface PendingApprovalTimesheetListResponse {
    data: PendingApprovalTimesheetRow[]
    meta: {
        page: number
        perPage: number
        totalCount: number
        totalPages: number
    }
}

export interface PendingApprovalReminderResult {
    engagementsWithoutManagers: Array<{ engagementId: string, engagementTitle: string }>
    recipients: Array<{ handle: string, sent: boolean, userId: string }>
    sentCount: number
    skippedAssignmentIds: string[]
}
