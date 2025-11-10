/**
 * Resources service
 */
import qs from 'qs'

import {
    PaginatedResponse,
    xhrGetPaginatedAsync,
    xhrPutAsync,
} from '~/libs/core'
import { EnvironmentConfig } from '~/config'

import {
    adjustBackendResource,
    BackendResource,
    BackendResourceRole,
} from '../models'

const resourceBaseUrl = `${EnvironmentConfig.API.V6}`
const DEFAULT_PER_PAGE = 1000

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
    const baseQuery = {
        ...query,
        page: 1,
        perPage: DEFAULT_PER_PAGE,
    }
    const firstPage = await xhrGetPaginatedAsync<BackendResource[]>(
        `${resourceBaseUrl}/resources?${qs.stringify(baseQuery)}`,
    )
    const totalPages = firstPage.totalPages ?? 0

    if (totalPages <= 1) {
        return {
            ...firstPage,
            data: firstPage.data
                .map(adjustBackendResource)
                .filter((resource): resource is BackendResource => Boolean(resource)),
        }
    }

    const remainingPagePromises: Array<Promise<PaginatedResponse<BackendResource[]>>> = []
    for (let page = 2; page <= totalPages; page += 1) {
        remainingPagePromises.push(
            xhrGetPaginatedAsync<BackendResource[]>(
                `${resourceBaseUrl}/resources?${qs.stringify({
                    ...query,
                    page,
                    perPage: DEFAULT_PER_PAGE,
                })}`,
            ),
        )
    }

    const remainingPages = await Promise.all(remainingPagePromises)
    const combinedData = [
        ...firstPage.data,
        ...remainingPages.flatMap(pageResult => pageResult.data),
    ]

    return {
        ...firstPage,
        data: combinedData
            .map(adjustBackendResource)
            .filter((resource): resource is BackendResource => Boolean(resource)),
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

/**
 * Update resource phase change notifications preference.
 * @param resourceId resource identifier
 * @param phaseChangeNotifications desired preference value
 */
export const updatePhaseChangeNotifications = async (
    resourceId: string,
    phaseChangeNotifications: boolean,
): Promise<void> => {
    await xhrPutAsync(
        `${resourceBaseUrl}/resources/${resourceId}/phase-change-notifications`,
        {
            phaseChangeNotifications,
        },
    )
}
