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

import { EnvironmentConfig } from '~/config'
import { handleError } from '~/libs/shared'
import { getRatingColor } from '~/libs/core'

import {
    ActiveReviewAssignment,
    BackendMyReviewAssignment,
} from '../models'
import {
    fetchActiveReviews,
    FetchActiveReviewsParams,
} from '../services'
import { formatDurationDate } from '../utils'
import { TABLE_DATE_FORMAT } from '../../config/index.config'

export const DEFAULT_ACTIVE_REVIEWS_PER_PAGE = 50

export interface ActiveReviewsPagination {
    page: number
    perPage: number
    totalPages: number
    totalCount: number
}

export interface useFetchActiveReviewsProps {
    activeReviews: ActiveReviewAssignment[]
    isLoading: boolean
    loadActiveReviews: (params?: FetchActiveReviewsParams) => Promise<void>
    pagination: ActiveReviewsPagination
}

export const transformAssignments = (
    assignments: BackendMyReviewAssignment[],
    startIndex = 1,
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
    let index = startIndex
    const mapped: ActiveReviewAssignment[] = []

    assignmentsByChallenge.forEach(items => {
        const base = items[0]
        const currentPhaseEndDate = base.currentPhaseEndDate
            ? new Date(base.currentPhaseEndDate)
            : undefined
        const challengeEndDate = base.challengeEndDate
            ? new Date(base.challengeEndDate)
            : undefined
        const timeMetadata = currentPhaseEndDate
            ? formatDurationDate(currentPhaseEndDate, now)
            : undefined

        const resourceRoles = uniq(
            items
                .map(item => item.resourceRoleName)
                .filter((role): role is string => Boolean(role)),
        )

        const firstPlaceWinner = base.winners
            ?.find(winner => winner?.placement === 1)
        const winnerHandle = firstPlaceWinner?.handle
        const winnerProfileUrl = winnerHandle
            ? `${EnvironmentConfig.REVIEW.PROFILE_PAGE_URL}/${winnerHandle}`
            : undefined
        const winnerHandleColor = firstPlaceWinner
            ? getRatingColor(
                typeof firstPlaceWinner.maxRating === 'number'
                    ? firstPlaceWinner.maxRating
                    : undefined,
            )
            : undefined

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
            challengeEndDate,
            challengeEndDateString: challengeEndDate
                ? moment(challengeEndDate)
                    .local()
                    .format(TABLE_DATE_FORMAT)
                : undefined,
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
            winnerHandle,
            winnerHandleColor,
            winnerProfileUrl,
        })
    })

    return mapped
}

type LoadActiveReviewsInternalParams = Required<Pick<FetchActiveReviewsParams, 'page' | 'perPage'>> & {
    challengeTypeId?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

function mergeActiveReviewParams(
    current: LoadActiveReviewsInternalParams,
    next?: FetchActiveReviewsParams,
): LoadActiveReviewsInternalParams {
    const merged: LoadActiveReviewsInternalParams = {
        ...current,
        page: next?.page ?? current.page,
        perPage: next?.perPage ?? current.perPage,
    }

    if (next && Object.prototype.hasOwnProperty.call(next, 'challengeTypeId')) {
        merged.challengeTypeId = next.challengeTypeId
    }

    if (next && Object.prototype.hasOwnProperty.call(next, 'sortBy')) {
        merged.sortBy = next.sortBy ?? undefined
    }

    if (next && Object.prototype.hasOwnProperty.call(next, 'sortOrder')) {
        merged.sortOrder = next.sortOrder ?? undefined
    }

    if (!merged.sortBy) {
        delete merged.sortBy
        delete merged.sortOrder
    } else if (!merged.sortOrder) {
        delete merged.sortOrder
    }

    return merged
}

/**
 * Fetch active review assignments.
 * @returns active review assignments
 */
export function useFetchActiveReviews(): useFetchActiveReviewsProps {
    const [activeReviews, setActiveReviews]
        = useState<ActiveReviewAssignment[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [pagination, setPagination] = useState<ActiveReviewsPagination>(() => ({
        page: 1,
        perPage: DEFAULT_ACTIVE_REVIEWS_PER_PAGE,
        totalCount: 0,
        totalPages: 1,
    }))
    const latestRequestKeyRef = useRef<string>('')
    const latestParamsRef = useRef<LoadActiveReviewsInternalParams>({
        challengeTypeId: undefined,
        page: 1,
        perPage: DEFAULT_ACTIVE_REVIEWS_PER_PAGE,
        sortBy: undefined,
        sortOrder: undefined,
    })

    const loadActiveReviews = useCallback(
        async (params?: FetchActiveReviewsParams) => {
            const mergedParams = mergeActiveReviewParams(
                latestParamsRef.current,
                params,
            )

            latestParamsRef.current = mergedParams

            const requestKey = [
                mergedParams.challengeTypeId ?? '',
                mergedParams.page,
                mergedParams.perPage,
                mergedParams.sortBy ?? '',
                mergedParams.sortOrder ?? '',
            ].join('|')
            latestRequestKeyRef.current = requestKey
            setIsLoading(true)

            try {
                const response = await fetchActiveReviews(mergedParams)
                if (latestRequestKeyRef.current !== requestKey) {
                    return
                }

                const currentPage = response.meta?.page ?? mergedParams.page
                const currentPerPage = response.meta?.perPage ?? mergedParams.perPage
                const startIndex = (currentPage - 1) * currentPerPage + 1

                setActiveReviews(transformAssignments(response.data, startIndex))
                setPagination({
                    page: currentPage,
                    perPage: currentPerPage,
                    totalCount: response.meta?.totalCount ?? response.data.length,
                    totalPages: Math.max(response.meta?.totalPages ?? 1, 1),
                })
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
        pagination,
    }
}
