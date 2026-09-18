import type { EngagementManager } from './EngagementManager.model'

/**
 * Workflow status of one timesheet entry. `DRAFT` is displayed as `-`.
 *
 * There is deliberately no rejected status: a manager who disagrees asks the member to edit the entry,
 * which returns it to draft, or escalates to an administrator.
 */
export enum TimesheetEntryStatus {
    APPROVED = 'APPROVED',
    DRAFT = 'DRAFT',
    SUBMITTED = 'SUBMITTED',
}

/** The caller's relationship to a timesheet, resolved server-side and returned on every response. */
export enum TimesheetViewerRole {
    ADMINISTRATOR = 'ADMINISTRATOR',
    MANAGER = 'MANAGER',
    MEMBER = 'MEMBER',
}

export interface TimesheetEntry {
    approvalComment: string | null
    approvedAt: string | null
    approvedByHandle: string | null
    /** Exact decimal string, e.g. `8.50`. Hours become a payment amount, so they never travel as floats. */
    hoursWorked: string
    id: string
    isPaid: boolean
    /** True when the work date falls outside the assignment's start/end dates. Allowed, but flagged. */
    outsideAssignmentWindow: boolean
    remarks: string | null
    /** Set when an administrator reopened a previously approved entry; the entry is back in draft. */
    reopenedAt: string | null
    status: TimesheetEntryStatus
    submittedAt: string | null
    /** `YYYY-MM-DD`. `DD-MM-YYYY` is display only. */
    workDate: string
}

export interface TimesheetAssignment {
    endDate: string | null
    id: string
    memberHandle: string
    memberId: string
    memberName: string | null
    standardHoursPerDay: number | null
    startDate: string | null
    status: string
}

export interface TimesheetView {
    assignment: TimesheetAssignment
    engagementId: string
    engagementTitle: string
    entries: TimesheetEntry[]
    managers: EngagementManager[]
    viewerRole: TimesheetViewerRole
}

export interface UpsertTimesheetEntryRequest {
    hoursWorked: string
    remarks?: string | null
    workDate: string
}

export interface UpsertTimesheetEntriesRequest {
    entries: UpsertTimesheetEntryRequest[]
    overrideReason?: string
}

export interface SubmitTimesheetEntriesRequest {
    entryIds: string[]
    overrideReason?: string
}

export interface ApproveTimesheetEntriesRequest {
    approvalComment: string
    entryIds: string[]
    overrideReason?: string
}

export interface ReopenTimesheetEntriesRequest {
    entryIds: string[]
    overrideReason: string
}

export interface SkippedTimesheetEntry {
    approvedByHandle: string | null
    currentStatus: TimesheetEntryStatus
    id: string
}

/**
 * Approval is partial by design: a second manager approving the same selection gets the entries the
 * first one already took back in `skipped`, rather than an error for the whole batch.
 */
export interface ApproveTimesheetEntriesResult {
    approved: string[]
    skipped: SkippedTimesheetEntry[]
}

export interface TimesheetQuery {
    fromDate?: string
    status?: TimesheetEntryStatus
    toDate?: string
}

/** Rolled-up per-assignee status on the manager and administrator landing lists. */
export type TimesheetRollupStatus = 'Approved' | 'Pending Approval'

export interface TimesheetEngagementRow {
    assigneeHandle: string
    assigneeId: string
    assigneeName: string | null
    assignmentId: string
    engagementId: string
    engagementTitle: string
    timesheetStatus: TimesheetRollupStatus
    viewerRole: TimesheetViewerRole
}

export interface TimesheetEngagementQuery {
    assignee?: string
    fromDate?: string
    manager?: string
    page?: number
    perPage?: number
    status?: TimesheetRollupStatus
    title?: string
    toDate?: string
}
