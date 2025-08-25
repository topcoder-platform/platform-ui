/**
 * Manage fetch challenge info
 */
import { useEffect, useRef, useState } from 'react'

import { Challenge } from '../models'
import { getChallengeById } from '../services'
import { handleError } from '../utils'

export interface useFetchChallengeProps {
    isLoading: boolean
    challengeInfo?: Challenge
}

/**
 * Fetch challenge info
 * @returns challenge info
 */
export function useFetchChallenge(
    challengeId: string,
): useFetchChallengeProps {
    const [isLoading, setIsLoading] = useState(false)

    const isLoadingRef = useRef(false)
    const [challengeInfo, setChallengeInfo] = useState<Challenge>()

    useEffect(() => {
        if (challengeId && !isLoadingRef.current) {
            isLoadingRef.current = true
            setIsLoading(isLoadingRef.current)
            setChallengeInfo(undefined)

            getChallengeById(challengeId)
                .then((data: Challenge) => {
                    isLoadingRef.current = false
                    setIsLoading(isLoadingRef.current)
                    setChallengeInfo(data)
                })
                .catch(e => {
                    isLoadingRef.current = false
                    setIsLoading(isLoadingRef.current)
                    handleError(e)
                })
        }
    }, [challengeId])

    return {
        challengeInfo,
        isLoading,
    }
}
