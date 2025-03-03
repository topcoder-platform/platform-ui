/**
 * Groups service
 */
import qs from 'qs'

import { EnvironmentConfig } from '~/config'
import { xhrDeleteAsync, xhrGetAsync, xhrPostAsync } from '~/libs/core'

import { UserGroup, UserGroupMember } from '../models'

/**
 * Get a groups of the particular member
 * @param params query params.
 * @returns resolves to the members group list
 *  by names.
 */
export const findByMember = async (params: {
    page: number
    perPage: number
    memberId: string
    membershipType: 'user'
}): Promise<UserGroup[]> => {
    const result = await xhrGetAsync<UserGroup[]>(
        `${EnvironmentConfig.API.V5}/groups/?${qs.stringify(params)}`,
    )
    return result
}

/**
 * Fetch all group members
 * @param groupId group id.
 * @param params query params.
 * @returns resolves to the group member list
 */
export const fetchGroupMembers = async (
    groupId: string,
    params: {
        page: number
        perPage: number
    },
): Promise<UserGroupMember[]> => {
    const result = await xhrGetAsync<UserGroupMember[]>(
        `${EnvironmentConfig.API.V5}/groups/${groupId}/members?${qs.stringify(
            params,
        )}`,
    )
    return result
}

/**
 * Fetch all groups
 * @returns resolves to the group list
 */
export const fetchGroups = async (params: {
    page: number
    perPage: number
}): Promise<UserGroup[]> => {
    const result = await xhrGetAsync<UserGroup[]>(
        `${EnvironmentConfig.API.V5}/groups?${qs.stringify(params)}`,
    )
    return result
}

/**
 * Add a member to the group specified by id
 * @param groupId group id.
 * @param entity membership entity to add.
 * @returns resolves to the groupId, if success.
 */
export const addMember = async (
    groupId: string,
    entity: {
        memberId: string
        membershipType: 'user'
    },
): Promise<string> => {
    const result = await xhrPostAsync<
        {
            memberId: string
            membershipType: 'user'
        },
        string
    >(`${EnvironmentConfig.API.V5}/groups/${groupId}/members`, entity)
    return result
}

/**
 * Remove a member from the group
 * @param groupId group id.
 * @param memberId member id.
 * @returns resolves to the groupId, if success.
 */
export const removeMember = async (
    groupId: string,
    memberId: number,
): Promise<string> => {
    const result = await xhrDeleteAsync<string>(
        `${EnvironmentConfig.API.V5}/groups/${groupId}/members/${memberId}`,
    )
    return result
}
