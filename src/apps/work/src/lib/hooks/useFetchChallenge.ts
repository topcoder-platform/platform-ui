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

/**
 * Fetch a single challenge and always allow an immediate remount revalidation.
 *
 * Challenge view/edit routes can be reopened right after a save. Setting
 * `dedupingInterval` to `0` avoids SWR reusing a recent in-flight/detail fetch
 * window and ensures the page asks challenge-api-v6 for the latest challenge
 * snapshot on remount.
 */
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
                dedupingInterval: 0,
                errorRetryCount: 2,
                shouldRetryOnError: true,
            },
        )

    return {
        challenge: error
            ? undefined
            : data,
        error,
        isError: !!error,
        isLoading: !!challengeId && !data && !error,
        mutate,
    }
}
