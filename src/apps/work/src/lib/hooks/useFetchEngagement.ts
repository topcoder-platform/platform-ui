import useSWR, { SWRResponse } from 'swr'

import { Engagement } from '../models'
import { fetchEngagement } from '../services'

export interface UseFetchEngagementResult {
    engagement: Engagement | undefined
    error: Error | undefined
    isError: boolean
    isLoading: boolean
    mutate: SWRResponse<Engagement, Error>['mutate']
}

export function useFetchEngagement(
    engagementId?: number | string,
): UseFetchEngagementResult {
    const swrKey = engagementId
        ? ['work/engagement', engagementId]
        : undefined

    const {
        data,
        error,
        mutate,
    }: SWRResponse<Engagement, Error>
        = useSWR<Engagement, Error>(
            swrKey,
            () => fetchEngagement(engagementId as string),
            {
                errorRetryCount: 2,
                shouldRetryOnError: true,
            },
        )

    return {
        engagement: data,
        error,
        isError: !!error,
        isLoading: !!engagementId && !data && !error,
        mutate,
    }
}
