/**
 * Fetch challenge tracks
 */

import { useState } from 'react'

import { useOnComponentDidMount } from '~/apps/admin/src/lib/hooks'
import { handleError } from '~/libs/shared'

import { BackendChallengeTrack } from '../models'
import { fetchChallengeTracks } from '../services'

export interface useFetchChallengeTracksProps {
    challengeTracks: BackendChallengeTrack[]
    isLoading: boolean
}

/**
 * Fetch challenge tracks
 * @returns challenge tracks
 */
export function useFetchChallengeTracks(): useFetchChallengeTracksProps {
    const [challengeTracks, setChallengeTracks] = useState<
        BackendChallengeTrack[]
    >([])
    const [isLoading, setIsLoading] = useState(false)

    useOnComponentDidMount(() => {
        setIsLoading(true)
        fetchChallengeTracks()
            .then(results => {
                setChallengeTracks(results.data)
                setIsLoading(false)
            })
            .catch(e => {
                handleError(e)
                setIsLoading(false)
            })
    })

    return {
        challengeTracks,
        isLoading,
    }
}
