import useSWR, { SWRResponse } from 'swr'

import { ResourceRole } from '../models'
import { fetchResourceRoles } from '../services'

export interface UseFetchResourceRolesResult {
    error: Error | undefined
    isError: boolean
    isLoading: boolean
    resourceRoles: ResourceRole[]
}

export function useFetchResourceRoles(): UseFetchResourceRolesResult {
    const {
        data,
        error,
    }: SWRResponse<ResourceRole[], Error>
        = useSWR<ResourceRole[], Error>(
            'work/resource-roles',
            fetchResourceRoles,
            {
                errorRetryCount: 2,
                shouldRetryOnError: true,
            },
        )

    return {
        error,
        isError: !!error,
        isLoading: !data && !error,
        resourceRoles: data || [],
    }
}
