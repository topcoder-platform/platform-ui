import useSWR, { SWRResponse } from 'swr'

import { EngagementManager } from '../models'
import { fetchEngagementManagers } from '../services'

export interface UseFetchEngagementManagersResult {
    error: Error | undefined
    isError: boolean
    isLoading: boolean
    managers: EngagementManager[]
    mutate: SWRResponse<EngagementManager[], Error>['mutate']
}

/**
 * Loads the managers authorized to approve timesheets on an engagement.
 *
 * Reads the engagements API's manager endpoints, the same ones the Engagements Portal uses, so this
 * list and the portal's are the same list rather than two copies.
 */
export function useFetchEngagementManagers(
    engagementId?: number | string,
): UseFetchEngagementManagersResult {
    const swrKey = engagementId
        ? ['work/engagement-managers', engagementId]
        : undefined

    const {
        data,
        error,
        mutate,
    }: SWRResponse<EngagementManager[], Error>
        = useSWR<EngagementManager[], Error>(
            swrKey,
            () => fetchEngagementManagers(engagementId as string),
            {
                errorRetryCount: 2,
                shouldRetryOnError: true,
            },
        )

    return {
        error,
        isError: !!error,
        isLoading: !!engagementId && !data && !error,
        managers: data ?? [],
        mutate,
    }
}
