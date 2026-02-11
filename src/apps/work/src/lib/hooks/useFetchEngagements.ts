import { useMemo } from 'react'
import useSWR, { KeyedMutator, SWRResponse } from 'swr'

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

export function useFetchEngagements(
    projectId: number | string | undefined,
    filters: EngagementFilters = {},
): UseFetchEngagementsResult {
    const page = filters.page || 1
    const perPage = filters.perPage || 20

    const requestFilters = useMemo(
        () => ({
            ...filters,
            projectId,
        }),
        [filters, projectId],
    )

    const swrKey = projectId
        ? ['work/engagements', requestFilters, page, perPage]
        : undefined

    const {
        data,
        error,
        isValidating,
        mutate,
    }: SWRResponse<FetchEngagementsResponse, Error>
        = useSWR<FetchEngagementsResponse, Error>(
            swrKey,
            () => fetchEngagements(requestFilters, {
                page,
                perPage,
            }),
            {
                errorRetryCount: 2,
                shouldRetryOnError: true,
            },
        )

    return {
        engagements: data?.data || [],
        error,
        isLoading: !!projectId && !data && !error,
        isValidating,
        metadata: data?.metadata || {
            page,
            perPage,
            total: 0,
            totalPages: 0,
        },
        mutate,
    }
}
