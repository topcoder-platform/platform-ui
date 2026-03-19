import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import useSWR, { KeyedMutator, SWRResponse } from 'swr'

import {
    PAGE_SIZE,
} from '../constants'
import {
    Challenge,
    ChallengeFilters,
    PaginationModel,
} from '../models'
import {
    fetchChallenges,
    FetchChallengesResponse,
} from '../services'

export interface UseFetchChallengesParams extends ChallengeFilters {
    page?: number
    perPage?: number
    appendResults?: boolean
}

export interface UseFetchChallengesResult {
    challenges: Challenge[]
    metadata: PaginationModel
    isLoading: boolean
    isValidating: boolean
    error: Error | undefined
    mutate: KeyedMutator<FetchChallengesResponse>
}

export function useFetchChallenges(
    {
        appendResults = false,
        endDateEnd,
        endDateStart,
        name,
        page = 1,
        perPage = PAGE_SIZE,
        projectId,
        sortBy = 'startDate',
        sortOrder = 'desc',
        startDateEnd,
        startDateStart,
        status,
        type,
    }: UseFetchChallengesParams,
): UseFetchChallengesResult {
    const [aggregatedChallenges, setAggregatedChallenges] = useState<Challenge[]>([])
    const [aggregatedMetadata, setAggregatedMetadata] = useState<PaginationModel>({
        page,
        perPage,
        total: 0,
        totalPages: 0,
    })
    const previousRequestRef = useRef<{
        appendKey: string
        page: number
    } | undefined>(undefined)

    const requestParams = useMemo(
        () => ({
            filters: {
                endDateEnd,
                endDateStart,
                name,
                projectId,
                sortBy,
                sortOrder,
                startDateEnd,
                startDateStart,
                status,
                type,
            },
            params: {
                page,
                perPage,
            },
        }),
        [
            endDateEnd,
            endDateStart,
            name,
            page,
            perPage,
            projectId,
            sortBy,
            sortOrder,
            startDateEnd,
            startDateStart,
            status,
            type,
        ],
    )

    const appendKey = useMemo(
        () => [
            endDateEnd || '',
            endDateStart || '',
            name || '',
            String(projectId ?? ''),
            sortBy || '',
            sortOrder || '',
            startDateEnd || '',
            startDateStart || '',
            Array.isArray(status)
                ? status.join(',')
                : (status || ''),
            type || '',
            String(perPage),
        ]
            .join('|'),
        [
            endDateEnd,
            endDateStart,
            name,
            perPage,
            projectId,
            sortBy,
            sortOrder,
            startDateEnd,
            startDateStart,
            status,
            type,
        ],
    )

    const swrKey = useMemo(
        () => ['work/challenges', requestParams],
        [requestParams],
    )

    const {
        data,
        error,
        isValidating,
        mutate,
    }: SWRResponse<FetchChallengesResponse, Error>
        = useSWR<FetchChallengesResponse, Error>(
            swrKey,
            () => fetchChallenges(requestParams.filters, requestParams.params),
            {
                errorRetryCount: 2,
                shouldRetryOnError: true,
            },
        )

    useEffect(() => {
        if (!appendResults || !data) {
            return
        }

        const previousRequest = previousRequestRef.current
        const hasSameQuery = !!previousRequest && previousRequest.appendKey === appendKey
        const isSequentialPage = hasSameQuery && page === previousRequest.page + 1
        const isSamePageRefresh = hasSameQuery && page === previousRequest.page

        if (!previousRequest || !hasSameQuery || page <= 1) {
            setAggregatedChallenges(data.data || [])
        } else if (isSequentialPage) {
            setAggregatedChallenges(current => {
                const existingIds = new Set(current.map(challenge => challenge.id))
                const nextPageChallenges = (data.data || [])
                    .filter(challenge => !existingIds.has(challenge.id))

                return [
                    ...current,
                    ...nextPageChallenges,
                ]
            })
        } else if (isSamePageRefresh) {
            setAggregatedChallenges(current => {
                const existingIds = new Set(current.map(challenge => challenge.id))
                const refreshedChallenges = (data.data || [])
                    .filter(challenge => !existingIds.has(challenge.id))

                if (!refreshedChallenges.length) {
                    return current
                }

                return [
                    ...current,
                    ...refreshedChallenges,
                ]
            })
        } else {
            setAggregatedChallenges(data.data || [])
        }

        setAggregatedMetadata(data.metadata || {
            page,
            perPage,
            total: 0,
            totalPages: 0,
        })

        previousRequestRef.current = {
            appendKey,
            page,
        }
    }, [appendKey, appendResults, data, page, perPage])

    const challenges = appendResults
        ? aggregatedChallenges
        : (data?.data || [])

    const metadata = appendResults
        ? aggregatedMetadata
        : (data?.metadata || {
            page,
            perPage,
            total: 0,
            totalPages: 0,
        })

    return {
        challenges,
        error,
        isLoading: !data && !error,
        isValidating,
        metadata,
        mutate,
    }
}
