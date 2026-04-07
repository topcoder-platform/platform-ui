import { useMemo } from 'react'
import useSWR, { KeyedMutator, SWRResponse } from 'swr'

import { ENGAGEMENTS_PAGE_SIZE } from '../../config/index.config'
import {
    Engagement,
    EngagementFilters,
    PaginationModel,
} from '../models'
import {
    fetchEngagements,
    FetchEngagementsResponse,
} from '../services'

export interface UseFetchEngagementsResult {
    engagements: Engagement[]
    error: Error | undefined
    isLoading: boolean
    isValidating: boolean
    metadata: PaginationModel
    mutate: KeyedMutator<FetchEngagementsResponse>
}

interface UseFetchEngagementsOptions {
    enabled?: boolean
}

interface EngagementPagesAccumulator {
    engagements: Engagement[]
    metadata: PaginationModel
}

function hasPagingMetadata(metadata: PaginationModel): boolean {
    return (
        (Number.isFinite(metadata.page) && metadata.page > 0)
        || (Number.isFinite(metadata.perPage) && metadata.perPage > 0)
        || (Number.isFinite(metadata.total) && metadata.total > 0)
        || (Number.isFinite(metadata.totalPages) && metadata.totalPages > 0)
    )
}

function toNonNegativeNumber(value: number, fallback: number = 0): number {
    return Number.isFinite(value) && value >= 0
        ? value
        : fallback
}

function toPositiveNumber(value: number, fallback: number = 0): number {
    return Number.isFinite(value) && value > 0
        ? value
        : fallback
}

function resolveTotalPages(
    totalPages: number,
    total: number,
    perPage: number,
): number {
    if (totalPages > 0) {
        return totalPages
    }

    if (total > 0 && perPage > 0) {
        return Math.ceil(total / perPage)
    }

    return 0
}

function shouldLoadNextPage(
    metadata: PaginationModel,
    page: number,
    pageSize: number,
): boolean {
    if (!hasPagingMetadata(metadata)) {
        return false
    }

    if (metadata.totalPages > 0) {
        return page < metadata.totalPages
    }

    if (metadata.perPage <= 0) {
        return false
    }

    return pageSize >= metadata.perPage
}

async function loadEngagementPages(
    filters: EngagementFilters,
    page: number,
    state: EngagementPagesAccumulator,
): Promise<EngagementPagesAccumulator> {
    const response = await fetchEngagements(filters, {
        page,
        perPage: state.metadata.perPage,
    })

    const perPage = toPositiveNumber(response.metadata.perPage, state.metadata.perPage)
    const total = toNonNegativeNumber(response.metadata.total, state.metadata.total)
    const totalPages = resolveTotalPages(
        toPositiveNumber(response.metadata.totalPages),
        total,
        perPage,
    )

    const metadata: PaginationModel = {
        page: 1,
        perPage,
        total,
        totalPages,
    }

    const nextState: EngagementPagesAccumulator = {
        engagements: [...state.engagements, ...response.data],
        metadata,
    }

    if (!shouldLoadNextPage(metadata, page, response.data.length)) {
        return nextState
    }

    return loadEngagementPages(filters, page + 1, nextState)
}

async function fetchAllEngagementPages(
    filters: EngagementFilters,
    perPage: number,
): Promise<FetchEngagementsResponse> {
    const initialState: EngagementPagesAccumulator = {
        engagements: [],
        metadata: {
            page: 1,
            perPage,
            total: 0,
            totalPages: 0,
        },
    }
    const result = await loadEngagementPages(filters, 1, initialState)

    const total = result.metadata.total || result.engagements.length
    const totalPages = result.metadata.totalPages || resolveTotalPages(
        0,
        total,
        result.metadata.perPage,
    )

    return {
        data: result.engagements,
        metadata: {
            page: 1,
            perPage: result.metadata.perPage,
            total,
            totalPages,
        },
    }
}

export function useFetchEngagements(
    projectId: number | string | undefined,
    filters: EngagementFilters = {},
    options: UseFetchEngagementsOptions = {},
): UseFetchEngagementsResult {
    const perPage = filters.perPage || ENGAGEMENTS_PAGE_SIZE
    const shouldFetch = options.enabled ?? !!projectId

    const requestFilters = useMemo(
        () => ({
            ...filters,
            projectId,
        }),
        [filters, projectId],
    )

    const swrKey = shouldFetch
        ? ['work/engagements', requestFilters, perPage]
        : undefined

    const {
        data,
        error,
        isValidating,
        mutate,
    }: SWRResponse<FetchEngagementsResponse, Error>
        = useSWR<FetchEngagementsResponse, Error>(
            swrKey,
            () => fetchAllEngagementPages(requestFilters, perPage),
            {
                errorRetryCount: 2,
                shouldRetryOnError: true,
            },
        )

    return {
        engagements: data?.data || [],
        error,
        isLoading: shouldFetch && !data && !error,
        isValidating,
        metadata: data?.metadata || {
            page: 1,
            perPage,
            total: 0,
            totalPages: 0,
        },
        mutate,
    }
}
