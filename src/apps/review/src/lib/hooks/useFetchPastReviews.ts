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
        challengeTypeId: undefined,
        page: 1,
        perPage: DEFAULT_PAST_REVIEWS_PER_PAGE,
    })

    const loadPastReviews = useCallback(
        async (params?: FetchPastReviewsParams) => {
            const mergedParams: LoadPastReviewsInternalParams = {
                challengeTypeId: params?.challengeTypeId ?? latestParamsRef.current.challengeTypeId,
                page: params?.page ?? latestParamsRef.current.page,
                perPage: params?.perPage ?? latestParamsRef.current.perPage,
            }

            latestParamsRef.current = mergedParams

            const requestKey = `${mergedParams.challengeTypeId ?? ''}|${mergedParams.page}|${mergedParams.perPage}`
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
