import { useEffect, useMemo, useState } from 'react'
import useSWR, { SWRResponse } from 'swr'

import {
    fetchProjectShowcasePostCategories,
    fetchProjectShowcasePostIndustries,
    fetchProjectShowcasePosts,
} from '../services'
import type {
    FetchProjectShowcasePostsParams,
    FetchProjectShowcasePostsResponse,
    ProjectShowcasePostCategory,
    ProjectShowcasePostIndustry,
} from '../models'

export interface UseFetchProjectShowcasePostsResult {
    posts: FetchProjectShowcasePostsResponse['posts']
    metadata: FetchProjectShowcasePostsResponse['metadata']
    isLoading: boolean
    isValidating: boolean
    error: Error | undefined
    mutate: SWRResponse<FetchProjectShowcasePostsResponse, Error>['mutate']
}

export function useFetchProjectShowcasePosts(
    params: FetchProjectShowcasePostsParams,
): UseFetchProjectShowcasePostsResult {
    const requestParams: FetchProjectShowcasePostsParams = useMemo(
        () => params,
        [params],
    )
    const swrKey = useMemo(
        () => [
            'work/project-showcase-posts',
            requestParams.projectId,
            requestParams.keyword || '',
            requestParams.status || '',
            requestParams.industryId || '',
            requestParams.categoryId || '',
            String(requestParams.page || 1),
            String(requestParams.perPage || 10),
            requestParams.sortBy || '',
            requestParams.sortOrder || '',
        ],
        [requestParams],
    )

    const [previousResponse, setPreviousResponse] = useState<FetchProjectShowcasePostsResponse | undefined>(undefined)

    const {
        data,
        error,
        isValidating,
        mutate,
    }: SWRResponse<FetchProjectShowcasePostsResponse, Error> = useSWR<FetchProjectShowcasePostsResponse, Error>(
        swrKey,
        () => fetchProjectShowcasePosts(requestParams),
        {
            errorRetryCount: 2,
            shouldRetryOnError: true,
        },
    )

    useEffect(() => {
        if (data) {
            setPreviousResponse(data)
        }
    }, [data])

    const response = data ?? previousResponse

    return {
        error,
        isLoading: !data && !error,
        isValidating,
        metadata: response?.metadata ?? {
            page: requestParams.page || 1,
            perPage: requestParams.perPage || 10,
            total: 0,
            totalPages: 0,
        },
        mutate,
        posts: response?.posts || [],
    }
}

export interface UseFetchProjectShowcaseTaxonomyResult<T> {
    items: T[]
    isLoading: boolean
    isValidating: boolean
    error: Error | undefined
    mutate: SWRResponse<T[], Error>['mutate']
}

export function useFetchProjectShowcasePostIndustries():
    UseFetchProjectShowcaseTaxonomyResult<ProjectShowcasePostIndustry> {
    const {
        data,
        error,
        isValidating,
        mutate,
    }: SWRResponse<ProjectShowcasePostIndustry[], Error> = useSWR(
        'work/showcase-post-industries',
        fetchProjectShowcasePostIndustries,
        {
            errorRetryCount: 2,
            shouldRetryOnError: true,
        },
    )

    return {
        error,
        isLoading: !data && !error,
        isValidating,
        items: data || [],
        mutate,
    }
}

export function useFetchProjectShowcasePostCategories():
    UseFetchProjectShowcaseTaxonomyResult<ProjectShowcasePostCategory> {
    const {
        data,
        error,
        isValidating,
        mutate,
    }: SWRResponse<ProjectShowcasePostCategory[], Error> = useSWR(
        'work/showcase-post-categories',
        fetchProjectShowcasePostCategories,
        {
            errorRetryCount: 2,
            shouldRetryOnError: true,
        },
    )

    return {
        error,
        isLoading: !data && !error,
        isValidating,
        items: data || [],
        mutate,
    }
}
