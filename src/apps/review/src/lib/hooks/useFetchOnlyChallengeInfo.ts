/**
 * Fetch only challenge info
 */

import { useCallback, useState } from 'react'

import { useOnComponentDidMount } from '~/apps/admin/src/lib/hooks'

import { ChallengeInfo } from '../models'
import { fetchChallengeInfo } from '../services'

export interface useFetchOnlyChallengeInfoProps {
    challengeInfo: ChallengeInfo | undefined
}

/**
 * Fetch only challenge info
 * @returns challenge info
 */
export function useFetchOnlyChallengeInfo(): useFetchOnlyChallengeInfoProps {
    const [challengeInfo, setChallengeInfo] = useState<ChallengeInfo>()
    const loadChallengeInfo = useCallback(() => {
        fetchChallengeInfo()
            .then(result => {
                setChallengeInfo(result)
            })
    }, [])

    useOnComponentDidMount(() => {
        loadChallengeInfo()
    })

    return {
        challengeInfo,
    }
}
