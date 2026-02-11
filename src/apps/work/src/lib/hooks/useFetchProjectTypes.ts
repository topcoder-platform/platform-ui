import useSWR, { SWRResponse } from 'swr'

import { ProjectType } from '../models'
import { fetchProjectTypes } from '../services'

export interface UseFetchProjectTypesResult {
    projectTypes: ProjectType[]
    isLoading: boolean
    error: Error | undefined
}

export function useFetchProjectTypes(): UseFetchProjectTypesResult {
    const {
        data,
        error,
    }: SWRResponse<ProjectType[], Error>
        = useSWR<ProjectType[], Error>(
            'work/project-types',
            fetchProjectTypes,
            {
                errorRetryCount: 2,
                shouldRetryOnError: true,
            },
        )

    return {
        error,
        isLoading: !data && !error,
        projectTypes: data || [],
    }
}
