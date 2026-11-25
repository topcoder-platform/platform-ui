import useSWR, { SWRResponse } from 'swr'

import {
    PendingSubmissionTimesheetListResponse,
    PendingSubmissionTimesheetQuery,
    PendingSubmissionTimesheetRow,
} from '../models'
import { fetchPendingSubmissionTimesheets } from '../services'

export interface UseFetchPendingSubmissionTimesheetsResult {
    error: Error | undefined
    isLoading: boolean
    meta: PendingSubmissionTimesheetListResponse['meta'] | undefined
    mutate: SWRResponse<PendingSubmissionTimesheetListResponse, Error>['mutate']
    rows: PendingSubmissionTimesheetRow[]
}

/**
 * Loads the assignments with nothing submitted for a work period, for the Pending Timesheet
 * Submissions tab.
 * Administrators only; the API refuses anyone else.
 */
export function useFetchPendingSubmissionTimesheets(
    query: PendingSubmissionTimesheetQuery,
    enabled: boolean = true,
): UseFetchPendingSubmissionTimesheetsResult {
    const swrKey = enabled
        ? [
            'work/pending-submission-timesheets',
            query.engagement || '',
            query.fromDate || '',
            query.toDate || '',
            query.excludeTestProjects ? 'exclude-test-projects' : '',
            query.managerAssigned ? 'manager-assigned' : '',
            String(query.page || ''),
            String(query.perPage || ''),
        ]
        : undefined

    const {
        data,
        error,
        mutate,
    }: SWRResponse<PendingSubmissionTimesheetListResponse, Error>
        = useSWR<PendingSubmissionTimesheetListResponse, Error>(
            swrKey,
            () => fetchPendingSubmissionTimesheets(query),
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
