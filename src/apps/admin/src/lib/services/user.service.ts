import _ from 'lodash'

import { EnvironmentConfig } from '~/config'
import {
    xhrDeleteAsync,
    xhrGetAsync,
    xhrPatchAsync,
    xhrPostAsync,
    xhrPutAsync,
} from '~/libs/core'

import {
    adjustUserInfoResponse,
    adjustUserStatusHistoryResponse,
    ApiV3Response,
    MemberInfo,
    SSOLoginProvider,
    SSOUserLogin,
    UserInfo,
    UserStatusHistory,
} from '../models'
import { FormAddSSOLoginData } from '../models/FormAddSSOLoginData.model'

/**
 * Gets the member suggest by handle.
 * @param {string} handle The handle search text.
 */
export const getMemberSuggestionsByHandle = async (
    handle: string,
): Promise<Array<MemberInfo>> => {
    if (!handle) {
        return []
    }

    type v3Response<T> = { result: { content: T } }
    const data = await xhrGetAsync<
        v3Response<Array<MemberInfo>>
    >(`${EnvironmentConfig.API.V3}/members/_suggest/${handle}`)
    return data.result.content
}

/**
 * Gets a list of members given a list of handles.
 * @param handles The handle.
 */
export const getMembersByHandle = async (
    handles: string[],
): Promise<Array<MemberInfo>> => {
    let qs = ''
    handles.forEach(handle => {
        qs += `&handlesLower[]=${handle.toLowerCase()}`
    })

    return xhrGetAsync<Array<MemberInfo>>(
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
    limit?: number
}): Promise<UserInfo[]> => {
    let query = ''
    const opts: {
        fields?: string
        filter?: string
        limit?: number
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
 * Get profile by handle.
 * @param handle the user handle.
 * @returns resolves to user info
 */
export const getProfile = async (handle: string): Promise<MemberInfo> => {
    if (!handle) {
        return Promise.reject(new Error('Handle must be specified.'))
    }

    const result = await xhrGetAsync<ApiV3Response<MemberInfo>>(
        `${EnvironmentConfig.API.V3}/members/${handle}`,
    )
    return result.result.content
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

/**
 * Find user by id.
 * @param userId user id.
 * @returns resolves to user info
 */
export const findUserById = async (
    userId: string | number,
): Promise<UserInfo> => {
    const result = await xhrGetAsync<ApiV3Response<UserInfo>>(
        `${EnvironmentConfig.API.V3}/users/${userId}`,
    )
    return adjustUserInfoResponse(result.result.content)
}

/**
 * Fetch list of sso user login.
 * @param userId user id.
 * @returns resolves to sso user logins
 */
export const fetchSSOUserLogins = async (
    userId: string | number,
): Promise<SSOUserLogin[]> => {
    const result = await xhrGetAsync<ApiV3Response<SSOUserLogin[]>>(
        `${EnvironmentConfig.API.V3}/users/${userId}/SSOUserLogins`,
    )
    return result.result.content
}

/**
 * Fetch list of sso login provider.
 * @returns resolves to sso user logins
 */
export const fetchSSOLoginProviders = async (): Promise<SSOLoginProvider[]> => {
    const result = await xhrGetAsync<ApiV3Response<SSOLoginProvider[]>>(
        `${EnvironmentConfig.API.V3}/ssoLoginProviders`,
    )
    return result.result.content
}

/**
 * Create sso user login.
 * @param userId user id.
 * @param userLogin user login info.
 * @returns resolves to sso user login
 */
export const createSSOUserLogin = async (
    userId: string | number,
    userLogin: FormAddSSOLoginData,
): Promise<SSOUserLogin> => {
    const result = await xhrPostAsync<
        {
            param: FormAddSSOLoginData
        },
        ApiV3Response<SSOUserLogin>
    >(`${EnvironmentConfig.API.V3}/users/${userId}/SSOUserLogin`, {
        param: userLogin,
    })
    return result.result.content
}

/**
 * Update sso user login.
 * @param userId user id.
 * @param userLogin user login info.
 * @returns resolves to sso user login
 */
export const updateSSOUserLogin = async (
    userId: string | number,
    userLogin: FormAddSSOLoginData,
): Promise<SSOUserLogin> => {
    const result = await xhrPutAsync<
        {
            param: FormAddSSOLoginData
        },
        ApiV3Response<SSOUserLogin>
    >(`${EnvironmentConfig.API.V3}/users/${userId}/SSOUserLogin`, {
        param: userLogin,
    })
    return result.result.content
}

/**
 * Delete sso user login.
 * @param userId user id.
 * @param provider login provider.
 * @returns resolves to sso user login
 */
export const deleteSSOUserLogin = async (
    userId: string | number,
    provider: string,
): Promise<SSOUserLogin> => {
    const result = await xhrDeleteAsync<ApiV3Response<SSOUserLogin>>(
        `${EnvironmentConfig.API.V3}/users/${userId}/SSOUserLogin?provider=${provider}`,
    )
    return result.result.content
}
