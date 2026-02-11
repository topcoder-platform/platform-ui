import useSWR, { SWRResponse } from 'swr'

import {
    TAAS_PAGE_SIZE,
} from '../constants'
import {
    fetchTaasProjects,
    FetchTaasProjectsParams,
    FetchTaasProjectsResponse,
} from '../services'

export type UseFetchTaasProjectsParams = FetchTaasProjectsParams

export interface UseFetchTaasProjectsResult {
    data: FetchTaasProjectsResponse | undefined
    error: Error | undefined
    isLoading: boolean
    mutate: SWRResponse<FetchTaasProjectsResponse, Error>['mutate']
}

export function useFetchTaasProjects(
    {
        keyword,
        memberOnly,
        page = 1,
        perPage = TAAS_PAGE_SIZE,
        status,
    }: UseFetchTaasProjectsParams = {},
): UseFetchTaasProjectsResult {
    const statusKey = Array.isArray(status)
        ? status.join(',')
        : (status || '')

    const swrKey = [
        'work/taas-projects',
        keyword || '',
        String(memberOnly ?? ''),
        String(page),
        String(perPage),
        statusKey,
    ]

    const {
        data,
        error,
        mutate,
    }: SWRResponse<FetchTaasProjectsResponse, Error>
        = useSWR<FetchTaasProjectsResponse, Error>(
            swrKey,
            () => fetchTaasProjects({
                keyword,
                memberOnly,
                page,
                perPage,
                status,
            }),
            {
                errorRetryCount: 2,
                shouldRetryOnError: true,
            },
        )

    return {
        data,
        error,
        isLoading: !data && !error,
        mutate,
    }
}
