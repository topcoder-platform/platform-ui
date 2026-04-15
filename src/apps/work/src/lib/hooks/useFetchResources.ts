import useSWR, { SWRResponse } from 'swr'

import { Resource } from '../models'
import { fetchResources } from '../services'

export interface UseFetchResourcesResult {
    error: Error | undefined
    isError: boolean
    isLoading: boolean
    mutate: SWRResponse<Resource[], Error>['mutate']
    resources: Resource[]
}

export function useFetchResources(challengeId?: string): UseFetchResourcesResult {
    const swrKey = challengeId
        ? [
            'resources',
            challengeId,
        ]
        : undefined

    const {
        data,
        error,
        mutate,
    }: SWRResponse<Resource[], Error>
        = useSWR<Resource[], Error>(
            swrKey,
            () => fetchResources(challengeId as string),
            {
                errorRetryCount: 2,
                shouldRetryOnError: true,
            },
        )

    return {
        error,
        isError: !!error,
        isLoading: !!challengeId && !data && !error,
        mutate,
        resources: data || [],
    }
}
