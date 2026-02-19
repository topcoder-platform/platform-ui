import useSWR, { SWRResponse } from 'swr'

import { fetchProjects, ProjectSummary } from '../services'

export interface UseFetchProjectsParams {
    enabled?: boolean
    memberOnly?: boolean
}

export interface UseFetchProjectsResult {
    projects: ProjectSummary[]
    isLoading: boolean
    isValidating: boolean
    error: Error | undefined
}

export function useFetchProjects(
    {
        enabled = true,
        memberOnly = false,
    }: UseFetchProjectsParams = {},
): UseFetchProjectsResult {
    const shouldFetch = enabled

    const {
        data,
        error,
        isValidating,
    }: SWRResponse<ProjectSummary[], Error>
        = useSWR<ProjectSummary[], Error>(
            shouldFetch
                ? ['work/projects', memberOnly]
                : undefined,
            () => fetchProjects({
                memberOnly,
            }),
            {
                errorRetryCount: 2,
                shouldRetryOnError: true,
            },
        )

    return {
        error,
        isLoading: shouldFetch && !data && !error,
        isValidating,
        projects: data || [],
    }
}
