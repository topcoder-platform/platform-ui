/**
 * Terms service
 */
import { EnvironmentConfig } from '~/config'
import {
    PaginatedResponse,
    xhrDeleteAsync,
    xhrGetPaginatedAsync,
    xhrPostAsync,
} from '~/libs/core'

import { ApiV5ResponseSuccess, UserTerm } from '../models'

/**
 * Fetch all terms list.
 * @param filter the filter.
 * @returns resolves to the terms list.
 */
export const fetchAllTerms = async (
    filter: string,
): Promise<
    PaginatedResponse<{
        result: UserTerm[]
    }>
> => {
    const result = await xhrGetPaginatedAsync<{
        result: UserTerm[]
    }>(`${EnvironmentConfig.API.V5}/terms?${filter}`)
    return result
}

/**
 * Add a term to the user.
 * @param termId the term id.
 * @param userId the user id.
 * @returns resolves to success or failure calling api.
 */
export const addUserTerm = async (
    termId: string,
    userId: string,
): Promise<ApiV5ResponseSuccess> => {
    const result = await xhrPostAsync<
        {
            userId: string
        },
        ApiV5ResponseSuccess
    >(`${EnvironmentConfig.API.V5}/terms/${termId}/users`, {
        userId,
    })
    return result
}

/**
 * Remove the user from term.
 * @param termId the term id.
 * @param userId the user id.
 * @returns resolves to success or failure calling api.
 */
export const removeTermUser = async (
    termId: string,
    userId: string,
): Promise<ApiV5ResponseSuccess> => {
    const result = await xhrDeleteAsync<ApiV5ResponseSuccess>(
        `${EnvironmentConfig.API.V5}/terms/${termId}/users/${userId}`,
    )
    return result
}
