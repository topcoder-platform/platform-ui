import useSWR, { SWRResponse } from 'swr'

import { type BackendRegistrant } from '../models'
import { fetchChallengeRegistrants } from '../services'

export interface UseRegistrantsResult {
    isLoading: boolean
    registrants: BackendRegistrant[]
}

/**
 * Fetches challenge registrants for the challenge detail registrants tab.
 *
 * @param challengeId Optional challenge identifier.
 * @returns Registrants and loading status.
 */
export function useRegistrants(challengeId?: string): UseRegistrantsResult {
    const {
        data: registrants,
        isValidating: isLoading,
    }: SWRResponse<BackendRegistrant[], Error> = useSWR<BackendRegistrant[], Error>(
        `community/registrants/${challengeId}`,
        {
            fetcher: () => fetchChallengeRegistrants(challengeId ?? ''),
            isPaused: () => !challengeId,
        },
    )

    return {
        isLoading,
        registrants: registrants ?? [],
    }
}
