import {
    useEffect,
} from 'react'
import useSWR, { SWRResponse } from 'swr'

import { handleError } from '~/libs/shared'

import { BackendSubmission } from '../models'
import { fetchSubmissions } from '../services'

export interface useFetchChallengeSubmissionsProps {
    challengeSubmissions: BackendSubmission[]
    isLoading: boolean
}

/**
 * Fetch challenge submissions
 * @param challengeId challenge id
 * @returns challenge submissions
 */
export function useFetchChallengeSubmissions(
    challengeId?: string,
): useFetchChallengeSubmissionsProps {
    // Use swr hooks for submissions fetching
    const {
        data: challengeSubmissions,
        error,
        isValidating: isLoading,
    }: SWRResponse<BackendSubmission[], Error> = useSWR<
        BackendSubmission[],
        Error
    >(`reviewBaseUrl/submissions/${challengeId}`, {
        fetcher: async () => {
            const results = await fetchSubmissions(1, 5000, challengeId ?? '')
            return results.data
        },
        isPaused: () => !challengeId,
    })

    // Show backend error when fetching data fail
    useEffect(() => {
        if (error) {
            handleError(error)
        }
    }, [error])

    return {
        challengeSubmissions: challengeSubmissions ?? [],
        isLoading,
    }
}
