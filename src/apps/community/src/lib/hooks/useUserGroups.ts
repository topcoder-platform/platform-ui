import qs from 'qs'
import useSWR, { SWRResponse } from 'swr'

import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

interface BackendUserGroup {
    id: string
}

export interface UseUserGroupsResult {
    groupIds: string[]
    isLoading: boolean
}

const groupsBaseUrl = `${EnvironmentConfig.API.V6}`

/**
 * Fetches all group memberships for a user.
 *
 * @param userId User identifier.
 * @returns Group objects returned by groups API.
 */
async function fetchUserGroups(userId: number): Promise<BackendUserGroup[]> {
    return xhrGetAsync<BackendUserGroup[]>(
        `${groupsBaseUrl}/groups/?${qs.stringify({
            memberId: userId,
            membershipType: 'user',
        })}`,
    )
}

/**
 * Returns ids of groups that include the specified user as a direct member.
 *
 * @param userId User identifier.
 * @returns Group id list and loading state.
 */
export function useUserGroups(userId: number | undefined): UseUserGroupsResult {
    const {
        data,
        isValidating: isLoading,
    }: SWRResponse<BackendUserGroup[], Error> = useSWR<BackendUserGroup[], Error>(
        `community/user-groups/${userId}`,
        {
            fetcher: () => fetchUserGroups(userId ?? 0),
            isPaused: () => userId === undefined,
        },
    )

    return {
        groupIds: (data ?? [])
            .map(group => group.id),
        isLoading,
    }
}
