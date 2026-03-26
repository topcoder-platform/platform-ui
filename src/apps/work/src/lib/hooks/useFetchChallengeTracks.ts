import useSWR, { SWRResponse } from 'swr'

import { Track } from '../models'
import { fetchChallengeTracks } from '../services'

export interface UseFetchChallengeTracksResult {
    isError: boolean
    isLoading: boolean
    tracks: Track[]
}

export function useFetchChallengeTracks(): UseFetchChallengeTracksResult {
    const {
        data,
        error,
    }: SWRResponse<Track[], Error>
        = useSWR<Track[], Error>(
            'work/challenge-tracks',
            fetchChallengeTracks,
            {
                errorRetryCount: 2,
                shouldRetryOnError: true,
            },
        )

    return {
        isError: !!error,
        isLoading: !data && !error,
        tracks: data || [],
    }
}
