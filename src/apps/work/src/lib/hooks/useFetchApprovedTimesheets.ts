import useSWR, { SWRResponse } from 'swr'

import {
    ApprovedTimesheetListResponse,
    ApprovedTimesheetQuery,
    ApprovedTimesheetRow,
} from '../models'
import { fetchApprovedTimesheets } from '../services'

export interface UseFetchApprovedTimesheetsResult {
    error: Error | undefined
    isLoading: boolean
    meta: ApprovedTimesheetListResponse['meta'] | undefined
    mutate: SWRResponse<ApprovedTimesheetListResponse, Error>['mutate']
    rows: ApprovedTimesheetRow[]
}

/**
 * Loads the approved, unpaid timesheets for the Approved Timesheets tab. The API scopes the rows to
 * the caller: every engagement for an administrator, their projects' engagements for a TM.
 */
export function useFetchApprovedTimesheets(
    query: ApprovedTimesheetQuery,
    enabled: boolean = true,
): UseFetchApprovedTimesheetsResult {
    const swrKey = enabled
        ? [
            'work/approved-timesheets',
            query.assignee || '',
            query.engagement || '',
            String(query.page || ''),
            String(query.perPage || ''),
        ]
        : undefined

    const {
        data,
        error,
        mutate,
    }: SWRResponse<ApprovedTimesheetListResponse, Error>
        = useSWR<ApprovedTimesheetListResponse, Error>(
            swrKey,
            () => fetchApprovedTimesheets(query),
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
