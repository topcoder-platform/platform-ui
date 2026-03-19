import useSWR, { SWRResponse } from 'swr'

import { Application } from '../models'
import { fetchApplications } from '../services'

export interface UseFetchApplicationsResult {
    applications: Application[]
    error: Error | undefined
    isLoading: boolean
    isValidating: boolean
    mutate: SWRResponse<Application[], Error>['mutate']
}

export function useFetchApplications(
    engagementId?: number | string,
    statusFilter?: string,
): UseFetchApplicationsResult {
    const swrKey = engagementId
        ? ['work/applications', engagementId, statusFilter || 'all']
        : undefined

    const {
        data,
        error,
        isValidating,
        mutate,
    }: SWRResponse<Application[], Error>
        = useSWR<Application[], Error>(
            swrKey,
            () => fetchApplications(engagementId as string, {
                status: statusFilter,
            }),
            {
                errorRetryCount: 2,
                shouldRetryOnError: true,
            },
        )

    return {
        applications: data || [],
        error,
        isLoading: !!engagementId && !data && !error,
        isValidating,
        mutate,
    }
}
