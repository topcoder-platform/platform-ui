import _ from 'lodash'

import { EnvironmentConfig } from '~/config'
import { xhrGetAsync, xhrPatchAsync } from '~/libs/core'

import {
    adjustUserInfoResponse,
    adjustUserStatusHistoryResponse,
    ApiV3Response,
    UserInfo,
    UserStatusHistory,
} from '../models'

/**
 * Gets the member suggest by handle.
 * @param {string} handle The handle search text.
 */
export const getMemberSuggestionsByHandle = async (
    handle: string,
): Promise<Array<{ handle: string }>> => {
    type v3Response<T> = { result: { content: T } }
    const data = await xhrGetAsync<v3Response<Array<{ handle: string }>>>(
        `${EnvironmentConfig.API.V3}/members/_suggest/${handle}`,
    )
    return data.result.content
}

/**
 * Gets a list of members given a list of handles.
 * @param handles The handle.
 */
export const getMembersByHandle = async (
    handles: string[],
): Promise<Array<{ handle: string }>> => {
    let qs = ''
    handles.forEach(handle => {
        qs += `&handlesLower[]=${handle.toLowerCase()}`
    })

    return xhrGetAsync<Array<{ handle: string }>>(
        `${EnvironmentConfig.API.V5}/members?fields=userId,handle${qs}`,
    )
}

/**
 * Search users.
 * @param options the search options.
 * @returns resolves to list of user
 */
export const searchUsers = async (options?: {
    fields?: string
    filter?: string
    limit?: string
}): Promise<UserInfo[]> => {
    let query = ''
    const opts: {
        fields?: string
        filter?: string
        limit?: string
    } = options || {}
    _.forOwn(
        {
            fields:
                opts.fields
                || 'id,handle,email,active,emailActive,status,credential,firstName,lastName,createdAt,modifiedAt',
            filter: opts.filter,
            limit: opts.limit,
        },
        (value, key) => {
            if (value) {
                query += `&${key}=${encodeURIComponent(value)}`
            }
        },
    )
    const result = await xhrGetAsync<ApiV3Response<UserInfo[]>>(
        `${EnvironmentConfig.API.V3}/users?${query}`,
    )
    return result.result.content.map(adjustUserInfoResponse)
}

/**
 * Update user email.
 * @param userId user id.
 * @param email new email.
 * @returns resolves to user info
 */
export const updateUserEmail = async (
    userId: string,
    email: string,
): Promise<UserInfo> => {
    const payload = JSON.stringify({
        param: {
            email,
        },
    })
    const result = await xhrPatchAsync<string, ApiV3Response<UserInfo>>(
        `${EnvironmentConfig.API.V3}/users/${userId}/email`,
        payload,
    )
    return result.result.content
}

/**
 * Update user status.
 * @param userId user id.
 * @param status new status.
 * @param comment comment for updating.
 * @returns resolves to user info
 */
export const updateUserStatus = async (
    userId: string,
    status: string,
    comment?: string,
): Promise<UserInfo> => {
    const payload = JSON.stringify({
        param: {
            status,
        },
    })
    const param = comment ? `?comment=${encodeURIComponent(comment)}` : ''
    const result = await xhrPatchAsync<string, ApiV3Response<UserInfo>>(
        `${EnvironmentConfig.API.V3}/users/${userId}/status${param}`,
        payload,
    )
    return adjustUserInfoResponse(result.result.content)
}

/**
 * Fetch achievements for the specified user id.
 * @param userId user id.
 * @returns resolves to list of achievement
 */
export const fetchAchievements = async (
    userId: string,
): Promise<UserStatusHistory[]> => {
    const result = await xhrGetAsync<ApiV3Response<UserStatusHistory[]>>(
        `${EnvironmentConfig.API.V3}/users/${userId}/achievements`,
    )
    return result.result.content.map(adjustUserStatusHistoryResponse)
}
