import useSWR, { SWRResponse } from 'swr'

import { PhaseDefinition } from '../models'
import { fetchChallengePhases } from '../services'

export interface UseFetchChallengePhasesResult {
    challengePhases: PhaseDefinition[]
    isLoading: boolean
    isError: boolean
    error: Error | undefined
    mutate: SWRResponse<PhaseDefinition[], Error>['mutate']
}

export function useFetchChallengePhases(): UseFetchChallengePhasesResult {
    const {
        data,
        error,
        mutate,
    }: SWRResponse<PhaseDefinition[], Error>
        = useSWR<PhaseDefinition[], Error>(
            'work/challenge-phases',
            fetchChallengePhases,
            {
                errorRetryCount: 2,
                shouldRetryOnError: true,
            },
        )

    return {
        challengePhases: data || [],
        error,
        isError: !!error,
        isLoading: !data && !error,
        mutate,
    }
}
