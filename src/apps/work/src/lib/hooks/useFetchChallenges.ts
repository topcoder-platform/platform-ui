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

function toFilterKeyValue(value: string | string[] | undefined): string {
    if (!value) {
        return ''
    }

    return Array.isArray(value)
        ? value.join(',')
        : value
}

export interface UseFetchChallengesParams extends ChallengeFilters {
    page?: number
    perPage?: number
    appendResults?: boolean
    enabled?: boolean
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
        approvalStatus,
        appendResults = false,
        endDateEnd,
        enabled = true,
        endDateStart,
        memberId,
        name,
        page = 1,
        perPage = PAGE_SIZE,
        projectId,
        projectIds,
        sortBy = 'startDate',
        sortOrder = 'desc',
        startDateEnd,
        startDateStart,
        status,
        type,
    }: UseFetchChallengesParams,
): UseFetchChallengesResult {
    const shouldFetch = enabled
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
    const aggregatedPagesRef = useRef<Map<number, Challenge[]>>(new Map())

    const requestParams = useMemo(
        () => ({
            filters: {
                approvalStatus,
                endDateEnd,
                endDateStart,
                memberId,
                name,
                projectId,
                projectIds,
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
            approvalStatus,
            endDateEnd,
            endDateStart,
            memberId,
            name,
            page,
            perPage,
            projectId,
            projectIds,
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
            toFilterKeyValue(approvalStatus),
            endDateEnd || '',
            endDateStart || '',
            String(memberId ?? ''),
            name || '',
            String(projectId ?? ''),
            (projectIds ?? []).join(','),
            sortBy || '',
            sortOrder || '',
            startDateEnd || '',
            startDateStart || '',
            toFilterKeyValue(status),
            type || '',
            String(perPage),
        ]
            .join('|'),
        [
            approvalStatus,
            endDateEnd,
            endDateStart,
            memberId,
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
        () => (shouldFetch
            ? ['work/challenges', requestParams]
            : undefined),
        [requestParams, shouldFetch],
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
        const shouldResetAggregatedPages = !previousRequest
            || !hasSameQuery
            || page <= 1
            || (!isSequentialPage && !isSamePageRefresh)

        if (shouldResetAggregatedPages) {
            aggregatedPagesRef.current = new Map()
        }

        aggregatedPagesRef.current.set(page, data.data || [])
        const seenChallengeIds = new Set<string>()
        const nextAggregatedChallenges = Array.from(aggregatedPagesRef.current.entries())
            .sort(([pageA], [pageB]) => pageA - pageB)
            .flatMap(([, challengesPage]) => challengesPage)
            .filter(challenge => {
                if (seenChallengeIds.has(challenge.id)) {
                    return false
                }

                seenChallengeIds.add(challenge.id)
                return true
            })

        setAggregatedChallenges(nextAggregatedChallenges)

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

    let challenges: Challenge[] = []
    let metadata: PaginationModel = {
        page,
        perPage,
        total: 0,
        totalPages: 0,
    }

    if (!error) {
        challenges = appendResults
            ? aggregatedChallenges
            : (data?.data || [])
        metadata = appendResults
            ? aggregatedMetadata
            : (data?.metadata || metadata)
    }

    return {
        challenges,
        error,
        isLoading: shouldFetch && !data && !error,
        isValidating,
        metadata,
        mutate,
    }
}
