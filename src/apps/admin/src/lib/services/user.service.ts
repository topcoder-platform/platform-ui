import _ from 'lodash'

import { EnvironmentConfig } from '~/config'
import type { PaginatedResponse } from '~/libs/core'
import {
    xhrDeleteAsync,
    xhrGetAsync,
    xhrGetPaginatedAsync,
    xhrPatchAsync,
    xhrPostAsync,
    xhrPutAsync,
    xhrRequestAsync,
} from '~/libs/core'

import {
    adjustUserInfoResponse,
    adjustUserStatusHistoryResponse,
    ApiV3Response,
    MemberInfo,
    MemberSendgridEmail,
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

    const sanitizedHandle = encodeURIComponent(handle.trim())

    type MemberAutocompleteResponse = {
        userId: number
        handle: string
        firstName?: string | null
        lastName?: string | null
        photoURL?: string | null
        maxRating?: unknown
    }

    const response = await xhrGetAsync<MemberAutocompleteResponse[]>(
        `${EnvironmentConfig.API.V6}/members/autocomplete/${sanitizedHandle}`,
    )

    return response.map(member => ({
        firstName: member.firstName ?? undefined,
        handle: member.handle,
        lastName: member.lastName ?? undefined,
        maxRating: member.maxRating,
        photoURL: member.photoURL ?? undefined,
        userId: member.userId,
    }))
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
        `${EnvironmentConfig.API.V6}/members?fields=userId,handle${qs}`,
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
                || [
                    'id',
                    'handle',
                    'email',
                    'active',
                    'emailActive',
                    'emailVerified',
                    'status',
                    'credential',
                    'firstName',
                    'lastName',
                    'createdAt',
                    'modifiedAt',
                ].join(','),
            filter: opts.filter,
            limit: opts.limit,
        },
        (value, key) => {
            if (value) {
                query += `&${key}=${encodeURIComponent(value)}`
            }
        },
    )
    const users = await xhrGetAsync<UserInfo[]>(
        `${EnvironmentConfig.API.V6}/users?${query}`,
    )
    return users.map(adjustUserInfoResponse)
}

/**
 * Search users with pagination metadata.
 * @param options the search options including pagination.
 * @returns resolves to paginated response of users
 */
export const searchUsersPaginated = async (options?: {
    fields?: string
    filter?: string
    limit?: number
    offset?: number
}): Promise<PaginatedResponse<UserInfo[]>> => {
    let query = ''
    const opts: {
        fields?: string
        filter?: string
        limit?: number
        offset?: number
    } = options || {}
    _.forOwn(
        {
            fields:
                opts.fields
                || [
                    'id',
                    'handle',
                    'email',
                    'active',
                    'emailActive',
                    'emailVerified',
                    'status',
                    'credential',
                    'firstName',
                    'lastName',
                    'createdAt',
                    'modifiedAt',
                ].join(','),
            filter: opts.filter,
            limit: opts.limit,
            offset: opts.offset,
        },
        (value, key) => {
            if (value !== undefined && value !== null && value !== '') {
                query += `&${key}=${encodeURIComponent(String(value))}`
            }
        },
    )
    const response = await xhrGetPaginatedAsync<UserInfo[]>(
        `${EnvironmentConfig.API.V6}/users?${query}`,
    )
    return {
        ...response,
        data: response.data.map(adjustUserInfoResponse),
    }
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

    const response = await xhrGetAsync<MemberInfo | ApiV3Response<MemberInfo>>(
        `${EnvironmentConfig.API.V6}/members/${handle}`,
    )

    if ('result' in response) {
        return response.result.content
    }

    return response
}

const getStringValue = (value: unknown): string | undefined => {
    if (typeof value === 'string') {
        const trimmedValue = value.trim()
        return trimmedValue || undefined
    }

    if (typeof value === 'number') {
        return `${value}`
    }

    return undefined
}

const getEmailValue = (value: unknown): string | undefined => {
    if (Array.isArray(value)) {
        const emails = value
            .map(getStringValue)
            .filter((item): item is string => Boolean(item))

        return emails.length ? emails.join(', ') : undefined
    }

    return getStringValue(value)
}

const getFirstMatchingValue = (
    record: Record<string, unknown>,
    keys: string[],
    isEmail = false,
): string | undefined => {
    for (const key of keys) {
        const value = isEmail ? getEmailValue(record[key]) : getStringValue(record[key])
        if (value) {
            return value
        }
    }

    return undefined
}

const mapMemberSendgridEmailResponse = (
    emailRecord: Record<string, unknown>,
): MemberSendgridEmail => ({
    fromEmail: getFirstMatchingValue(
        emailRecord,
        ['from_email', 'fromEmail', 'from'],
        true,
    ) ?? '-',
    status: getFirstMatchingValue(
        emailRecord,
        ['status', 'last_event_type', 'event_type', 'eventType'],
    ) ?? '-',
    subject: getFirstMatchingValue(emailRecord, ['subject']) ?? '-',
    timestamp: getFirstMatchingValue(
        emailRecord,
        ['last_event_time', 'timestamp', 'created_at', 'createdAt'],
    ) ?? '-',
    toEmail: getFirstMatchingValue(
        emailRecord,
        ['to_email', 'toEmail', 'to', 'to_emails', 'toEmails'],
        true,
    ) ?? '-',
})

/**
 * Fetch SendGrid email records for a member from the last 30 days.
 * @param handle member handle.
 * @returns resolves to normalized SendGrid activity records.
 */
export const fetchMemberSendgridEmails = async (
    handle: string,
): Promise<MemberSendgridEmail[]> => {
    const sanitizedHandle = handle.trim()
    if (!sanitizedHandle) {
        return Promise.reject(new Error('Handle must be specified.'))
    }

    const response = await xhrGetAsync<Record<string, unknown>[]>(
        `${EnvironmentConfig.API.V6}/members/${encodeURIComponent(sanitizedHandle)}/sendgrid-emails`,
    )

    return response.map(mapMemberSendgridEmailResponse)
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
    return xhrPatchAsync<string, UserInfo>(
        `${EnvironmentConfig.API.V6}/users/${userId}/email`,
        payload,
    )
}

/**
 * Update member handle.
 * @param handle current handle.
 * @param newHandle new handle.
 * @returns resolves to member info
 */
export const changeUserHandle = async (
    handle: string,
    newHandle: string,
): Promise<MemberInfo> => {
    const payload = {
        newHandle: newHandle.trim(),
    }

    return xhrPatchAsync<typeof payload, MemberInfo>(
        `${EnvironmentConfig.API.V6}/members/${encodeURIComponent(handle)}/change_handle`,
        payload,
    )
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
    const result = await xhrPatchAsync<string, UserInfo>(
        `${EnvironmentConfig.API.V6}/users/${userId}/status${param}`,
        payload,
    )
    return adjustUserInfoResponse(result)
}

/**
 * Fetch achievements for the specified user id.
 * @param userId user id.
 * @returns resolves to list of achievement
 */
export const fetchAchievements = async (
    userId: string,
): Promise<UserStatusHistory[]> => {
    const history = await xhrGetAsync<UserStatusHistory[]>(
        `${EnvironmentConfig.API.V6}/users/${userId}/achievements`,
    )
    return history.map(adjustUserStatusHistoryResponse)
}

/**
 * Find user by id.
 * @param userId user id.
 * @returns resolves to user info
 */
export const findUserById = async (
    userId: string | number,
): Promise<UserInfo> => {
    const user = await xhrGetAsync<UserInfo>(
        `${EnvironmentConfig.API.V6}/users/${userId}`,
    )
    return adjustUserInfoResponse(user)
}

/**
 * Fetch list of sso user login.
 * @param userId user id.
 * @returns resolves to sso user logins
 */
export const fetchSSOUserLogins = async (
    userId: string | number,
): Promise<SSOUserLogin[]> => xhrGetAsync<SSOUserLogin[]>(
    `${EnvironmentConfig.API.V6}/users/${userId}/SSOUserLogins`,
)

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
    const response = await xhrPostAsync<
        {
            param: FormAddSSOLoginData
        },
        SSOUserLogin
    >(`${EnvironmentConfig.API.V6}/users/${userId}/SSOUserLogin`, {
        param: userLogin,
    })
    return response
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
    const response = await xhrPutAsync<
        {
            param: FormAddSSOLoginData
        },
        SSOUserLogin
    >(`${EnvironmentConfig.API.V6}/users/${userId}/SSOUserLogin`, {
        param: userLogin,
    })
    return response
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
    const response = await xhrDeleteAsync<SSOUserLogin>(
        `${EnvironmentConfig.API.V6}/users/${userId}/SSOUserLogin?provider=${provider}`,
    )
    return response
}

/**
 * Permanently delete a user profile.
 * @param handle user handle.
 * @param ticketUrl delete request ticket url.
 */
export const deleteUser = async (
    handle: string,
    ticketUrl: string,
): Promise<void> => xhrRequestAsync<{ ticketUrl: string }, void>({
    data: { ticketUrl },
    method: 'DELETE',
    url: `${EnvironmentConfig.API.V6}/members/${encodeURIComponent(handle)}`,
})
