/**
 * Fetch past review assignments hook.
 */

import {
    useCallback,
    useRef,
    useState,
} from 'react'

import { handleError } from '~/libs/shared'

import { ActiveReviewAssignment } from '../models'
import { fetchPastReviews } from '../services'
import { transformAssignments } from './useFetchActiveReviews'

export interface useFetchPastReviewsProps {
    pastReviews: ActiveReviewAssignment[]
    isLoading: boolean
    loadPastReviews: (challengeTypeId?: string) => void
}

/**
 * Fetch past review assignments.
 * @returns past review assignments
 */
export function useFetchPastReviews(): useFetchPastReviewsProps {
    const [pastReviews, setPastReviews] = useState<ActiveReviewAssignment[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const latestRequestKeyRef = useRef<string>('')

    const loadPastReviews = useCallback(
        async (challengeTypeId?: string) => {
            const requestKey = challengeTypeId ?? ''
            latestRequestKeyRef.current = requestKey
            setIsLoading(true)

            try {
                const response = await fetchPastReviews(challengeTypeId)
                if (latestRequestKeyRef.current !== requestKey) {
                    return
                }

                setPastReviews(transformAssignments(response))
            } catch (error) {
                if (latestRequestKeyRef.current === requestKey) {
                    handleError(error)
                }
            } finally {
                if (latestRequestKeyRef.current === requestKey) {
                    setIsLoading(false)
                }
            }
        },
        [],
    )

    return {
        pastReviews,
        isLoading,
        loadPastReviews,
    }
}

export default useFetchPastReviews
