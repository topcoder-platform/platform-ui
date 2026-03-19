import useSWR, { SWRResponse } from 'swr'

import { Group } from '../models'
import { fetchGroups } from '../services'

export interface UseFetchGroupsResult {
    error: Error | undefined
    groups: Group[]
    isError: boolean
    isLoading: boolean
    mutate: () => Promise<Group[] | undefined>
}

export function useFetchGroups(filters?: { name?: string }): UseFetchGroupsResult {
    const normalizedGroupNameFilter = filters?.name?.trim() || ''

    const {
        data,
        error,
        mutate,
    }: SWRResponse<Group[], Error>
        = useSWR<Group[], Error>(
            [
                'work/groups',
                normalizedGroupNameFilter,
            ],
            () => fetchGroups({
                name: normalizedGroupNameFilter || undefined,
            }),
            {
                errorRetryCount: 2,
                shouldRetryOnError: true,
            },
        )

    return {
        error,
        groups: data || [],
        isError: !!error,
        isLoading: !data && !error,
        mutate: async () => mutate(),
    }
}
