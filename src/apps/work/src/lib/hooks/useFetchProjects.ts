import useSWR, { SWRResponse } from 'swr'

import { fetchProjects, ProjectSummary } from '../services'

export interface UseFetchProjectsParams {
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
        memberOnly = false,
    }: UseFetchProjectsParams = {},
): UseFetchProjectsResult {
    const {
        data,
        error,
        isValidating,
    }: SWRResponse<ProjectSummary[], Error>
        = useSWR<ProjectSummary[], Error>(
            ['work/projects', memberOnly],
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
        isLoading: !data && !error,
        isValidating,
        projects: data || [],
    }
}
