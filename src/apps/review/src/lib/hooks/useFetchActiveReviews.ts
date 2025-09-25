/**
 * Fetch active review assignments hook.
 */

import { uniq } from 'lodash'
import {
    useCallback,
    useRef,
    useState,
} from 'react'
import moment from 'moment'

import { handleError } from '~/libs/shared'

import {
    ActiveReviewAssignment,
    BackendMyReviewAssignment,
    ResponseFetchActiveReviews,
} from '../models'
import { fetchActiveReviews } from '../services'
import { formatDurationDate } from '../utils'
import { TABLE_DATE_FORMAT } from '../../config/index.config'

export interface useFetchActiveReviewsProps {
    activeReviews: ActiveReviewAssignment[]
    isLoading: boolean
    loadActiveReviews: (challengeTypeId?: string) => void
}

export const transformAssignments = (
    assignments: ResponseFetchActiveReviews,
): ActiveReviewAssignment[] => {
    const assignmentsByChallenge = new Map<string, BackendMyReviewAssignment[]>()

    assignments.forEach(item => {
        const existing = assignmentsByChallenge.get(item.challengeId)
        if (existing) {
            existing.push(item)
        } else {
            assignmentsByChallenge.set(item.challengeId, [item])
        }
    })

    const now = new Date()
    let index = 1
    const mapped: ActiveReviewAssignment[] = []

    assignmentsByChallenge.forEach(items => {
        const base = items[0]
        const currentPhaseEndDate = base.currentPhaseEndDate
            ? new Date(base.currentPhaseEndDate)
            : undefined
        const timeMetadata = currentPhaseEndDate
            ? formatDurationDate(currentPhaseEndDate, now)
            : undefined

        const resourceRoles = uniq(
            items
                .map(item => item.resourceRoleName)
                .filter((role): role is string => Boolean(role)),
        )

        const reviewProgressValues = items
            .map(item => item.reviewProgress)
            .filter((value): value is number => typeof value === 'number')

        const aggregatedReviewProgress = reviewProgressValues.length
            ? Math.round(
                reviewProgressValues.reduce((total, value) => total + value, 0)
                / reviewProgressValues.length,
            )
            : undefined

        const currentIndex = index
        index += 1

        mapped.push({
            challengeTypeId: base.challengeTypeId,
            challengeTypeName: base.challengeTypeName,
            currentPhase: base.currentPhaseName,
            currentPhaseEndDate,
            currentPhaseEndDateString: currentPhaseEndDate
                ? moment(currentPhaseEndDate)
                    .local()
                    .format(TABLE_DATE_FORMAT)
                : undefined,
            id: base.challengeId,
            index: currentIndex,
            name: base.challengeName,
            resourceRoles,
            reviewProgress: aggregatedReviewProgress,
            timeLeft: timeMetadata?.durationString,
            timeLeftColor: timeMetadata?.durationColor,
            timeLeftStatus: timeMetadata?.durationStatus,
        })
    })

    return mapped
}

/**
 * Fetch active review assignments.
 * @returns active review assignments
 */
export function useFetchActiveReviews(): useFetchActiveReviewsProps {
    const [activeReviews, setActiveReviews]
        = useState<ActiveReviewAssignment[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const latestRequestKeyRef = useRef<string>('')

    const loadActiveReviews = useCallback(
        async (challengeTypeId?: string) => {
            const requestKey = challengeTypeId ?? ''
            latestRequestKeyRef.current = requestKey
            setIsLoading(true)

            try {
                const response = await fetchActiveReviews(challengeTypeId)
                if (latestRequestKeyRef.current !== requestKey) {
                    return
                }

                setActiveReviews(transformAssignments(response))
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
        activeReviews,
        isLoading,
        loadActiveReviews,
    }
}
