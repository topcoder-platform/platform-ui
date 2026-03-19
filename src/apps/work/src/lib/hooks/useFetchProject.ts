import useSWR, { SWRResponse } from 'swr'

import { Project } from '../models'
import { fetchProjectById } from '../services'

export interface UseFetchProjectResult {
    project: Project | undefined
    isLoading: boolean
    error: Error | undefined
    mutate: SWRResponse<Project, Error>['mutate']
}

export function useFetchProject(projectId: string | undefined): UseFetchProjectResult {
    const swrKey = projectId
        ? ['work/project', projectId]
        : undefined

    const {
        data,
        error,
        mutate,
    }: SWRResponse<Project, Error>
        = useSWR<Project, Error>(
            swrKey,
            () => fetchProjectById(projectId as string),
            {
                errorRetryCount: 2,
                shouldRetryOnError: true,
            },
        )

    return {
        error,
        isLoading: !!projectId && !data && !error,
        mutate,
        project: data,
    }
}
