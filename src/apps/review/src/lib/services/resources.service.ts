/**
 * Resources service
 */
import qs from 'qs'

import { PaginatedResponse, xhrGetPaginatedAsync } from '~/libs/core'
import { EnvironmentConfig } from '~/config'

import {
    adjustBackendResource,
    BackendResource,
    BackendResourceRole,
} from '../models'

const resourceBaseUrl = `${EnvironmentConfig.API.V6}`

/**
 * Fetch all resource roles
 * to get resource name.
 * @returns resolves to the list of resource role
 */
export const fetchAllResourceRoles = async (): Promise<
    PaginatedResponse<BackendResourceRole[]>
> => xhrGetPaginatedAsync<BackendResourceRole[]>(
    `${resourceBaseUrl}/resource-roles`,
)

/**
 * Fetch all resources
 * @param query query filter
 * @returns resolves to the list of resource
 */
export const fetchResources = async (query: {
    challengeId?: string
    memberId?: string
}): Promise<PaginatedResponse<BackendResource[]>> => {
    const results = await xhrGetPaginatedAsync<BackendResource[]>(
        `${resourceBaseUrl}/resources?${qs.stringify(query)}`,
    )

    return {
        ...results,
        data: results.data.map(adjustBackendResource) as BackendResource[],
    }
}

/**
 * Fetch all challenge resources.
 * @param challengeId challenge id
 * @returns resolves to the list of resource
 */
export const fetchChallengeResouces = async (
    challengeId: string,
): Promise<PaginatedResponse<BackendResource[]>> => fetchResources({
    challengeId,
})
