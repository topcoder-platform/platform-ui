import useSWR, { SWRResponse } from 'swr'

import { ChallengeInfo } from '../models'
import { fetchChallengeById } from '../services'

export interface UseChallengeResult {
    challenge: ChallengeInfo | undefined
    isLoading: boolean
}

/**
 * Fetches details for a single challenge.
 *
 * @param challengeId Optional challenge identifier.
 * @returns Challenge info and loading status.
 */
export function useChallenge(challengeId?: string): UseChallengeResult {
    const {
        data: challenge,
        isValidating: isLoading,
    }: SWRResponse<ChallengeInfo, Error> = useSWR<ChallengeInfo, Error>(
        `community/challenge/${challengeId}`,
        {
            fetcher: () => fetchChallengeById(challengeId ?? ''),
            isPaused: () => !challengeId,
        },
    )

    return {
        challenge,
        isLoading,
    }
}
