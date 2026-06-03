/**
 * Fetch challenge info
 */

import {
    useEffect,
} from 'react'
import useSWR, { SWRResponse } from 'swr'

import { handleError } from '~/apps/admin/src/lib/utils'

import {
    ChallengeInfo,
} from '../models'
import { fetchChallengeInfoById } from '../services'

export interface useFetchChallengeInfoProps {
    challengeInfo: ChallengeInfo | undefined
    error: Error | undefined
    isError: boolean
    isLoading: boolean
    retry: () => Promise<ChallengeInfo | undefined>
}

/**
 * Fetch challenge info
 * @param challengeId challenge id
 * @returns challenge info
 */
export function useFetchChallengeInfo(
    challengeId?: string,
): useFetchChallengeInfoProps {
    // Use swr hooks for challenge info fetching
    const {
        data: challengeInfo,
        error: fetchChallengeInfoError,
        isValidating: isLoading,
        mutate,
    }: SWRResponse<ChallengeInfo, Error> = useSWR<ChallengeInfo, Error>(
        `challengeBaseUrl/challenges/${challengeId}`,
        {
            fetcher: () => fetchChallengeInfoById(challengeId ?? ''),
            isPaused: () => !challengeId,
        },
    )

    // Show backend error when fetching challenge info
    useEffect(() => {
        if (fetchChallengeInfoError) {
            handleError(fetchChallengeInfoError)
        }
    }, [fetchChallengeInfoError])

    return {
        challengeInfo: fetchChallengeInfoError
            ? undefined
            : challengeInfo,
        error: fetchChallengeInfoError,
        isError: !!fetchChallengeInfoError,
        isLoading,
        retry: () => mutate(),
    }
}
