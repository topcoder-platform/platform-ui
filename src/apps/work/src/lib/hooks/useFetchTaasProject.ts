import useSWR, { SWRResponse } from 'swr'

import {
    Project,
} from '../models'
import {
    fetchTaasProjectById,
} from '../services'

export interface UseFetchTaasProjectResult {
    data: Project | undefined
    error: Error | undefined
    isLoading: boolean
    mutate: SWRResponse<Project, Error>['mutate']
}

export function useFetchTaasProject(projectId: string | undefined): UseFetchTaasProjectResult {
    const swrKey = projectId
        ? ['work/taas-project', projectId]
        : undefined

    const {
        data,
        error,
        mutate,
    }: SWRResponse<Project, Error>
        = useSWR<Project, Error>(
            swrKey,
            () => fetchTaasProjectById(projectId as string),
            {
                errorRetryCount: 2,
                shouldRetryOnError: true,
            },
        )

    return {
        data,
        error,
        isLoading: !!projectId && !data && !error,
        mutate,
    }
}
