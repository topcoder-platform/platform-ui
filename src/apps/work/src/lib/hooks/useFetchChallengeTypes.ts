import useSWR, { SWRResponse } from 'swr'

import { ChallengeType } from '../models'
import { fetchChallengeTypes } from '../services'

export interface UseFetchChallengeTypesResult {
    challengeTypes: ChallengeType[]
    isLoading: boolean
    isValidating: boolean
    error: Error | undefined
}

export function useFetchChallengeTypes(): UseFetchChallengeTypesResult {
    const {
        data,
        error,
        isValidating,
    }: SWRResponse<ChallengeType[], Error>
        = useSWR<ChallengeType[], Error>(
            'work/challenge-types',
            fetchChallengeTypes,
            {
                errorRetryCount: 2,
                shouldRetryOnError: true,
            },
        )

    return {
        challengeTypes: data || [],
        error,
        isLoading: !data && !error,
        isValidating,
    }
}
