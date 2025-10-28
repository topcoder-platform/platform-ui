/**
 * Fetch past review assignments hook.
 */

import {
    MutableRefObject,
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
    challengeName?: string
    challengeStatus?: string
    challengeTrackId?: string
    challengeTypeId?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

type FetchPastReviewsResponse = Awaited<ReturnType<typeof fetchPastReviews>>

interface DerivedPastReviewsState {
    pagination: PastReviewsPagination
    startIndex: number
}

function buildRequestKey(params: LoadPastReviewsInternalParams): string {
    return [
        params.challengeTypeId ?? '',
        params.challengeTrackId ?? '',
        params.challengeName ?? '',
        params.challengeStatus ?? '',
        params.page,
        params.perPage,
        params.sortBy ?? '',
        params.sortOrder ?? '',
    ].join('|')
}

function executeWhenLatestRequest(
    latestKeyRef: MutableRefObject<string>,
    requestKey: string,
    action: () => void,
): void {
    if (latestKeyRef.current === requestKey) {
        action()
    }
}

function derivePastReviewsState(
    response: FetchPastReviewsResponse,
    params: LoadPastReviewsInternalParams,
): DerivedPastReviewsState {
    const currentPage = response.meta?.page ?? params.page
    const currentPerPage = response.meta?.perPage ?? params.perPage

    return {
        pagination: {
            page: currentPage,
            perPage: currentPerPage,
            totalCount: response.meta?.totalCount ?? response.data.length,
            totalPages: response.meta?.totalPages ?? 1,
        },
        startIndex: (currentPage - 1) * currentPerPage + 1,
    }
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

        const value = next[key as keyof FetchPastReviewsParams]
        merged[key] = (value ?? undefined) as LoadPastReviewsInternalParams[K]
    }

    assignFromNext('challengeName')
    assignFromNext('challengeStatus')
    assignFromNext('challengeTrackId')
    assignFromNext('challengeTypeId')
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
        challengeStatus: undefined,
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

            const requestKey = buildRequestKey(mergedParams)
            latestRequestKeyRef.current = requestKey
            setIsLoading(true)

            try {
                const response = await fetchPastReviews(mergedParams)
                executeWhenLatestRequest(latestRequestKeyRef, requestKey, () => {
                    const {
                        pagination: nextPagination,
                        startIndex,
                    }: DerivedPastReviewsState = derivePastReviewsState(
                        response,
                        mergedParams,
                    )

                    setPastReviews(transformAssignments(response.data, startIndex))
                    setPagination(nextPagination)
                })
            } catch (error) {
                executeWhenLatestRequest(latestRequestKeyRef, requestKey, () => {
                    handleError(error)
                })
            } finally {
                executeWhenLatestRequest(latestRequestKeyRef, requestKey, () => {
                    setIsLoading(false)
                })
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
