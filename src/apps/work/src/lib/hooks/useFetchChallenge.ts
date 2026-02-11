import useSWR, { SWRResponse } from 'swr'

import { Challenge } from '../models'
import { fetchChallenge } from '../services'

export interface UseFetchChallengeResult {
    challenge: Challenge | undefined
    error: Error | undefined
    isError: boolean
    isLoading: boolean
    mutate: SWRResponse<Challenge, Error>['mutate']
}

export function useFetchChallenge(challengeId?: string): UseFetchChallengeResult {
    const swrKey = challengeId
        ? ['work/challenge', challengeId]
        : undefined

    const {
        data,
        error,
        mutate,
    }: SWRResponse<Challenge, Error>
        = useSWR<Challenge, Error>(
            swrKey,
            () => fetchChallenge(challengeId as string),
            {
                errorRetryCount: 2,
                shouldRetryOnError: true,
            },
        )

    return {
        challenge: data,
        error,
        isError: !!error,
        isLoading: !!challengeId && !data && !error,
        mutate,
    }
}
