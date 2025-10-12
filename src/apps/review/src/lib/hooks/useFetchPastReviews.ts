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
import {
    fetchPastReviews,
    FetchPastReviewsParams,
} from '../services'

import { transformAssignments } from './useFetchActiveReviews'

export const DEFAULT_PAST_REVIEWS_PER_PAGE = 50

export interface PastReviewsPagination {
    page: number
    perPage: number
    totalPages: number
    totalCount: number
}

export interface useFetchPastReviewsProps {
    isLoading: boolean
    loadPastReviews: (params?: FetchPastReviewsParams) => Promise<void>
    pagination: PastReviewsPagination
    pastReviews: ActiveReviewAssignment[]
}

type LoadPastReviewsInternalParams = Required<Pick<FetchPastReviewsParams, 'page' | 'perPage'>> & {
    challengeTypeId?: string
    challengeTrackId?: string
    challengeName?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

function mergePastReviewParams(
    current: LoadPastReviewsInternalParams,
    next?: FetchPastReviewsParams,
): LoadPastReviewsInternalParams {
    const merged: LoadPastReviewsInternalParams = {
        ...current,
        page: next?.page ?? current.page,
        perPage: next?.perPage ?? current.perPage,
    }

    function assignFromNext<K extends keyof LoadPastReviewsInternalParams>(key: K): void {
        if (!next || !Object.prototype.hasOwnProperty.call(next, key)) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const value = (next as any)[key];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (merged as any)[key] = value ?? undefined
    }

    assignFromNext('challengeTypeId')
    assignFromNext('challengeTrackId')
    assignFromNext('challengeName')
    assignFromNext('sortBy')
    assignFromNext('sortOrder')

    if (!merged.sortBy) {
        delete merged.sortBy
        delete merged.sortOrder
    } else if (!merged.sortOrder) {
        delete merged.sortOrder
    }

    return merged
}

/**
 * Fetch past review assignments.
 * @returns past review assignments
 */
export function useFetchPastReviews(): useFetchPastReviewsProps {
    const [pastReviews, setPastReviews] = useState<ActiveReviewAssignment[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [pagination, setPagination] = useState<PastReviewsPagination>(() => ({
        page: 1,
        perPage: DEFAULT_PAST_REVIEWS_PER_PAGE,
        totalCount: 0,
        totalPages: 1,
    }))
    const latestRequestKeyRef = useRef<string>('')
    const latestParamsRef = useRef<LoadPastReviewsInternalParams>({
        challengeName: undefined,
        challengeTrackId: undefined,
        challengeTypeId: undefined,
        page: 1,
        perPage: DEFAULT_PAST_REVIEWS_PER_PAGE,
        sortBy: undefined,
        sortOrder: undefined,
    })

    const loadPastReviews = useCallback(
        async (params?: FetchPastReviewsParams) => {
            const mergedParams = mergePastReviewParams(
                latestParamsRef.current,
                params,
            )

            latestParamsRef.current = mergedParams

            const requestKey = [
                mergedParams.challengeTypeId ?? '',
                mergedParams.challengeTrackId ?? '',
                mergedParams.challengeName ?? '',
                mergedParams.page,
                mergedParams.perPage,
                mergedParams.sortBy ?? '',
                mergedParams.sortOrder ?? '',
            ].join('|')
            latestRequestKeyRef.current = requestKey
            setIsLoading(true)

            try {
                const response = await fetchPastReviews(mergedParams)
                if (latestRequestKeyRef.current !== requestKey) {
                    return
                }

                const currentPage = response.meta?.page ?? mergedParams.page
                const currentPerPage = response.meta?.perPage ?? mergedParams.perPage
                const startIndex = (currentPage - 1) * currentPerPage + 1

                setPastReviews(transformAssignments(response.data, startIndex))
                setPagination({
                    page: currentPage,
                    perPage: currentPerPage,
                    totalCount: response.meta?.totalCount ?? response.data.length,
                    totalPages: response.meta?.totalPages ?? 1,
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
        isLoading,
        loadPastReviews,
        pagination,
        pastReviews,
    }
}

export default useFetchPastReviews
