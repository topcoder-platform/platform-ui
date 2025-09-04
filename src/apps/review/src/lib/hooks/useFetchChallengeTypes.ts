/**
 * Fetch challenge types
 */

import { useState } from 'react'

import { useOnComponentDidMount } from '~/apps/admin/src/lib/hooks'
import { handleError } from '~/libs/shared'

import { BackendChallengeType } from '../models'
import { fetchChallengeTypes } from '../services'

export interface useFetchChallengeTypesProps {
    challengeTypes: BackendChallengeType[]
    isLoading: boolean
}

/**
 * Fetch challenge types
 * @returns challenge types
 */
export function useFetchChallengeTypes(): useFetchChallengeTypesProps {
    const [challengeTypes, setChallengeTypes] = useState<
        BackendChallengeType[]
    >([])
    const [isLoading, setIsLoading] = useState(false)

    useOnComponentDidMount(() => {
        setIsLoading(true)
        fetchChallengeTypes()
            .then(results => {
                setChallengeTypes(results.data)
                setIsLoading(false)
            })
            .catch(e => {
                handleError(e)
                setIsLoading(false)
            })
    })

    return {
        challengeTypes,
        isLoading,
    }
}
