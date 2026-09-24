import useSWR, { SWRResponse } from 'swr'

import {
    getTimesheetEngagements,
    TimesheetEngagementListResponse,
    TimesheetEngagementQuery,
    TimesheetEngagementRow,
} from '~/apps/engagements'

export interface UseFetchEngagementTimesheetsResult {
    error: Error | undefined
    isError: boolean
    isLoading: boolean
    meta: TimesheetEngagementListResponse['meta'] | undefined
    mutate: SWRResponse<TimesheetEngagementListResponse, Error>['mutate']
    timesheets: TimesheetEngagementRow[]
}

/**
 * Loads timesheet rows for the manager/administrator landing list.
 *
 * Reads the engagements API's timesheet engagement endpoint so filtering and pagination stay aligned
 * with the Engagements Portal list.
 */
export function useFetchEngagementTimesheets(
    query: TimesheetEngagementQuery = {},
): UseFetchEngagementTimesheetsResult {
    const swrKey = [
        'work/engagement-timesheets',
        query.assignee || '',
        query.fromDate || '',
        query.manager || '',
        String(query.page || ''),
        String(query.perPage || ''),
        query.status || '',
        query.title || '',
        query.toDate || '',
    ]

    const {
        data,
        error,
        mutate,
    }: SWRResponse<TimesheetEngagementListResponse, Error>
        = useSWR<TimesheetEngagementListResponse, Error>(
            swrKey,
            () => getTimesheetEngagements(query),
            {
                errorRetryCount: 2,
                shouldRetryOnError: true,
            },
        )

    return {
        error,
        isError: !!error,
        isLoading: !data && !error,
        meta: data?.meta,
        mutate,
        timesheets: data?.data ?? [],
    }
}
