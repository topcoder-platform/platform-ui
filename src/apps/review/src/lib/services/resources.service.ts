/**
 * Resources service
 */
import qs from 'qs'

import { PaginatedResponse, xhrGetPaginatedAsync } from '~/libs/core'
import { EnvironmentConfig } from '~/config'

import { BackendResource, BackendResourceRole } from '../models'

const resourceBaseUrl = `${EnvironmentConfig.API.V6}`

/**
 * Fetch all resource roles.
 *
 * @returns resolves to the list of resource role
 */
export const fetchAllResourceRoles = async (): Promise<
    PaginatedResponse<BackendResourceRole[]>
> => xhrGetPaginatedAsync<BackendResourceRole[]>(
    `${resourceBaseUrl}/resource-roles`,
)

/**
 * Fetch all member role.
 *
 * @param challengeId challenge id
 * @param memberId member id
 * @returns resolves to the list of role
 */
export const fetchAllMemberRoles = async (
    challengeId: string,
    memberId: string,
): Promise<PaginatedResponse<BackendResource[]>> => xhrGetPaginatedAsync<BackendResource[]>(
    `${resourceBaseUrl}/resources?${qs.stringify({
        challengeId,
        memberId,
    })}`,
)
