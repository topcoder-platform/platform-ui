/**
 * Fetch list of resources of challenge
 */
import { useContext, useEffect, useMemo } from 'react'
import { filter, reduce, toString } from 'lodash'
import useSWR, { SWRResponse } from 'swr'

import { handleError } from '~/apps/admin/src/lib/utils'

import { BackendResource, ReviewAppContextModel } from '../models'
import { ReviewAppContext } from '../contexts'
import { fetchResources } from '../services/resources.service'

export interface useFetchChallengeResourcesProps {
    registrants: BackendResource[]
    reviewers: BackendResource[]
    myResources: BackendResource[]
    myRoles: string[]
    isLoading: boolean
    resourceMemberIdMapping: {
        [memberId: string]: BackendResource
    }
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
        resourceRoleReviewer,
        resourceRoleMapping,
    }: ReviewAppContextModel = useContext(ReviewAppContext)

    // Use swr hooks for registrants fetching
    const {
        data: resources,
        error: fetchResourcesError,
        isValidating: isLoading,
    }: SWRResponse<BackendResource[], Error> = useSWR<BackendResource[], Error>(
        `resourceBaseUrl/resources?challengeId=${challengeId}`,
        {
            fetcher: async () => {
                const result = await fetchResources({
                    challengeId,
                })
                return result.data
            },
            isPaused: () => !challengeId,
        },
    )

    // get mapping of member id to resource
    const resourceMemberIdMapping = useMemo(() => reduce(
        resources,
        (mappingResult, resource: BackendResource) => ({
            ...mappingResult,
            [resource.memberId]: resource,
        }),
        {},
    ), [resources])

    // Get my resources for the current challenge
    const myResources = useMemo(
        () => (resources ?? [])
            .filter(resource => resource.memberId === toString(loginUserInfo?.userId))
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

    // Get reviewers from resource list
    const reviewers = useMemo(() => {
        if (!resourceRoleReviewer) {
            return []
        }

        return filter(resources, { roleId: resourceRoleReviewer.id })
    }, [resources, resourceRoleReviewer])

    return {
        isLoading,
        myResources,
        myRoles,
        registrants,
        resourceMemberIdMapping,
        reviewers,
    }
}
