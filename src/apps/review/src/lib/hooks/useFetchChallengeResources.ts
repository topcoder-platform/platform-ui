/**
 * Fetch list of resources of challenge
 */
import { useContext, useEffect, useMemo } from 'react'
import { filter, toString } from 'lodash'
import useSWR, { SWRResponse } from 'swr'

import { handleError } from '~/apps/admin/src/lib/utils'

import {
    adjustRegistrationInfo,
    BackendResource,
    RegistrationInfo,
    ReviewAppContextModel,
} from '../models'
import { ReviewAppContext } from '../contexts'
import { fetchResources } from '../services/resources.service'

export interface useFetchChallengeResourcesProps {
    registrants: RegistrationInfo[]
    myResources: BackendResource[]
    myRoles: string[]
    isLoading: boolean
}

/**
 * Fetch list of resources of challenge
 * @param challengeId challenge id
 * @returns list of registrants
 */
export function useFetchChallengeResources(
    challengeId?: string,
): useFetchChallengeResourcesProps {
    const {
        loginUserInfo,
        resourceRoleSubmitter,
        resourceRoleMapping,
    }: ReviewAppContextModel = useContext(ReviewAppContext)

    // Use swr hooks for registrants fetching
    const {
        data: resources,
        error: fetchResourcesError,
        isValidating: isLoading,
    }: SWRResponse<RegistrationInfo[], Error> = useSWR<
        RegistrationInfo[],
        Error
    >(`resourceBaseUrl/resources?challengeId=${challengeId}`, {
        fetcher: async () => {
            const result = await fetchResources({
                challengeId,
            })
            return result.data.map(adjustRegistrationInfo) as RegistrationInfo[]
        },
        isPaused: () => !challengeId,
    })

    // Get my resources for the current challenge
    const myResources = useMemo(
        () => (resources ?? [])
            .filter(
                resource => resource.memberId === toString(loginUserInfo?.userId),
            )
            .map(myRoleInfo => ({
                ...myRoleInfo,
                roleName: resourceRoleMapping?.[myRoleInfo.roleId]?.name,
            })),
        [resources, loginUserInfo, resourceRoleMapping],
    )

    // Get list of role name
    const myRoles = useMemo(
        () => myResources
            .map(myRoleInfo => myRoleInfo.roleName)
            .filter(item => !!item) as string[],
        [myResources],
    )

    // Show backend error when fetching registrants
    useEffect(() => {
        if (fetchResourcesError) {
            handleError(fetchResourcesError)
        }
    }, [fetchResourcesError])

    // Get registrants from resource list
    const registrants = useMemo(() => {
        if (!resourceRoleSubmitter) {
            return []
        }

        return filter(resources, { roleId: resourceRoleSubmitter.id })
    }, [resources, resourceRoleSubmitter])

    return {
        isLoading,
        myResources,
        myRoles,
        registrants,
    }
}
