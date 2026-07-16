import useSWR, { SWRResponse } from 'swr'

import { ChallengeReviewContext } from '../models'
import { fetchChallengeReviewContextByChallenge } from '../services'

export interface UseFetchChallengeReviewContextResult {
    context: ChallengeReviewContext | undefined
    error: string | undefined
    isError: boolean
    isLoading: boolean
    mutate: SWRResponse<ChallengeReviewContext | undefined, Error>['mutate']
}

export function useFetchChallengeReviewContext(challengeId?: string): UseFetchChallengeReviewContextResult {
    const swrKey = challengeId
        ? ['work/challenge/review-context', challengeId]
        : undefined

    const {
        data,
        error,
        mutate,
        isValidating,
    }: SWRResponse<ChallengeReviewContext | undefined, Error>
        = useSWR<ChallengeReviewContext | undefined, Error>(
            swrKey,
            () => fetchChallengeReviewContextByChallenge(challengeId as string),
            {
                dedupingInterval: 0,
                errorRetryCount: 2,
                shouldRetryOnError: true,
            },
        )

    return {
        context: error
            ? undefined
            : data,
        error: error?.message,
        isError: !!error,
        isLoading: !!challengeId && !data && !error && isValidating,
        mutate,
    }
}
