import { EnvironmentConfig } from '~/config'
import { xhrGetAsync, xhrPostAsync, xhrPutAsync } from '~/libs/core'

import type {
    ApproveTimesheetEntriesRequest,
    ApproveTimesheetEntriesResult,
    ReopenTimesheetEntriesRequest,
    SubmitTimesheetEntriesRequest,
    TimesheetAuditRecord,
    TimesheetEngagementListResponse,
    TimesheetEngagementQuery,
    TimesheetQuery,
    TimesheetView,
    UpsertTimesheetEntriesRequest,
} from '../models'

const ENGAGEMENTS_URL = `${EnvironmentConfig.API.V6}/engagements`

const timesheetUrl = (engagementId: string, assignmentId: string): string => (
    `${ENGAGEMENTS_URL}/engagements/${engagementId}/assignments/${assignmentId}/timesheets`
)

const toQueryString = (params: Record<string, string | number | undefined>): string => {
    const search = new URLSearchParams()

    Object.entries(params)
        .forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                search.set(key, String(value))
            }
        })

    const queryString = search.toString()
    return queryString ? `?${queryString}` : ''
}

/**
 * Reads one assignment's timesheet, with the header every view displays.
 *
 * The response carries `viewerRole`, which is how the page knows whether to render the member, manager,
 * or administrator view - the server decides, the client renders.
 */
export const getTimesheet = async (
    engagementId: string,
    assignmentId: string,
    query: TimesheetQuery = {},
): Promise<TimesheetView> => (
    xhrGetAsync<TimesheetView>(
        `${timesheetUrl(engagementId, assignmentId)}${toQueryString({
            fromDate: query.fromDate,
            status: query.status,
            toDate: query.toDate,
        })}`,
    )
)

/**
 * Creates or updates entries, keyed on work date.
 *
 * Only the days the member actually filled in are sent. The resulting status is derived server-side, so
 * editing a submitted entry returns it to draft without the client asking for that.
 */
export const saveTimesheetEntries = async (
    engagementId: string,
    assignmentId: string,
    data: UpsertTimesheetEntriesRequest,
): Promise<TimesheetView> => (
    xhrPutAsync<UpsertTimesheetEntriesRequest, TimesheetView>(
        `${timesheetUrl(engagementId, assignmentId)}/entries`,
        data,
    )
)

/** Sends draft entries to the engagement's managers. Atomic: nothing partially submits. */
export const submitTimesheetEntries = async (
    engagementId: string,
    assignmentId: string,
    data: SubmitTimesheetEntriesRequest,
): Promise<TimesheetView> => (
    xhrPostAsync<SubmitTimesheetEntriesRequest, TimesheetView>(
        `${timesheetUrl(engagementId, assignmentId)}/submit`,
        data,
    )
)

/**
 * Approves submitted entries.
 *
 * Partial success is normal: entries another manager already approved come back in `skipped` with their
 * handle, so the caller can say who got there first rather than reporting a failure.
 */
export const approveTimesheetEntries = async (
    engagementId: string,
    assignmentId: string,
    data: ApproveTimesheetEntriesRequest,
): Promise<ApproveTimesheetEntriesResult> => (
    xhrPostAsync<ApproveTimesheetEntriesRequest, ApproveTimesheetEntriesResult>(
        `${timesheetUrl(engagementId, assignmentId)}/approve`,
        data,
    )
)

/** Returns approved entries to draft. Administrators only, and a reason is always required. */
export const reopenTimesheetEntries = async (
    engagementId: string,
    assignmentId: string,
    data: ReopenTimesheetEntriesRequest,
): Promise<TimesheetView> => (
    xhrPostAsync<ReopenTimesheetEntriesRequest, TimesheetView>(
        `${timesheetUrl(engagementId, assignmentId)}/reopen`,
        data,
    )
)

/** The manager and administrator landing list: one row per (engagement, assignee). */
export const getTimesheetEngagements = async (
    query: TimesheetEngagementQuery = {},
): Promise<TimesheetEngagementListResponse> => (
    xhrGetAsync(
        `${ENGAGEMENTS_URL}/timesheets/engagements${toQueryString({
            assignee: query.assignee,
            fromDate: query.fromDate,
            manager: query.manager,
            page: query.page,
            perPage: query.perPage,
            status: query.status,
            title: query.title,
            toDate: query.toDate,
        })}`,
    )
)

/**
 * Audit history for one entry, newest first. Administrators only - the API refuses anyone else.
 */
export const getTimesheetEntryAudit = async (
    engagementId: string,
    assignmentId: string,
    entryId: string,
): Promise<TimesheetAuditRecord[]> => (
    xhrGetAsync<TimesheetAuditRecord[]>(
        `${timesheetUrl(engagementId, assignmentId)}/entries/${entryId}/audit`,
    )
)
