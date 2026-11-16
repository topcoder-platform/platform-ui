import useSWR, { SWRResponse } from 'swr'

import {
    PendingApprovalTimesheetListResponse,
    PendingApprovalTimesheetQuery,
    PendingApprovalTimesheetRow,
} from '../models'
import { fetchPendingApprovalTimesheets } from '../services'

export interface UseFetchPendingApprovalTimesheetsResult {
    error: Error | undefined
    isLoading: boolean
    meta: PendingApprovalTimesheetListResponse['meta'] | undefined
    mutate: SWRResponse<PendingApprovalTimesheetListResponse, Error>['mutate']
    rows: PendingApprovalTimesheetRow[]
}

/**
 * Loads the submitted, not yet approved timesheets for the Pending Timesheet Approvals tab.
 * Administrators only; the API refuses anyone else.
 */
export function useFetchPendingApprovalTimesheets(
    query: PendingApprovalTimesheetQuery,
    enabled: boolean = true,
): UseFetchPendingApprovalTimesheetsResult {
    const swrKey = enabled
        ? [
            'work/pending-approval-timesheets',
            query.engagement || '',
            query.fromDate || '',
            query.toDate || '',
            query.excludeTestProjects ? 'exclude-test-projects' : '',
            String(query.page || ''),
            String(query.perPage || ''),
        ]
        : undefined

    const {
        data,
        error,
        mutate,
    }: SWRResponse<PendingApprovalTimesheetListResponse, Error>
        = useSWR<PendingApprovalTimesheetListResponse, Error>(
            swrKey,
            () => fetchPendingApprovalTimesheets(query),
            {
                errorRetryCount: 2,
                shouldRetryOnError: true,
            },
        )

    return {
        error,
        isLoading: enabled && !data && !error,
        meta: data?.meta,
        mutate,
        rows: data?.data ?? [],
    }
}
