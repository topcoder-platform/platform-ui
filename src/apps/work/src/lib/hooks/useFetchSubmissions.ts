import useSWR, { SWRResponse } from 'swr'

import { Submission } from '../models'
import {
    fetchSubmissions,
    fetchSubmissionsByChallenge,
    type FetchSubmissionsResponse,
} from '../services'

export interface UseFetchSubmissionsResult {
    error: Error | undefined
    isError: boolean
    isLoading: boolean
    mutate: SWRResponse<FetchSubmissionsResponse, Error>['mutate']
    submissions: Submission[]
    total: number
}

export interface UseFetchSubmissionsOptions {
    fetchAll?: boolean
}

export function useFetchSubmissions(
    challengeId?: string,
    page: number = 1,
    perPage: number = 20,
    options: UseFetchSubmissionsOptions = {},
): UseFetchSubmissionsResult {
    const shouldFetchAll = options.fetchAll === true

    const swrKey = challengeId
        ? [
            'submissions',
            challengeId,
            shouldFetchAll
                ? 'all'
                : 'page',
            ...(shouldFetchAll
                ? []
                : [
                    page,
                    perPage,
                ]),
        ]
        : undefined

    const {
        data,
        error,
        mutate,
    }: SWRResponse<FetchSubmissionsResponse, Error>
        = useSWR<FetchSubmissionsResponse, Error>(
            swrKey,
            async () => {
                if (shouldFetchAll) {
                    const allSubmissions = await fetchSubmissions(challengeId as string)

                    return {
                        data: allSubmissions,
                        page: 1,
                        perPage: allSubmissions.length || perPage,
                        total: allSubmissions.length,
                    }
                }

                return fetchSubmissionsByChallenge(
                    challengeId as string,
                    {
                        page,
                        perPage,
                    },
                )
            },
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
        submissions: data?.data || [],
        total: data?.total || 0,
    }
}
