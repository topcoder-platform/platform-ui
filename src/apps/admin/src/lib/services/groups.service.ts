/**
 * Groups service
 */
import qs from 'qs'

import { EnvironmentConfig } from '~/config'
import { xhrDeleteAsync, xhrGetAsync, xhrPostAsync } from '~/libs/core'

import {
    adjustUserGroupMemberResponse,
    adjustUserGroupResponse,
    FormAddGroup,
    UserGroup,
    UserGroupMember,
} from '../models'

/**
 * Get a groups of the particular member
 * @param params query params.
 * @returns resolves to the group list.
 */
export const findGroupByMember = async (params: {
    page: number
    perPage: number
    memberId: string
    membershipType: 'user'
}): Promise<UserGroup[]> => {
    const result = await xhrGetAsync<UserGroup[]>(
        `${EnvironmentConfig.API.V5}/groups/?${qs.stringify(params)}`,
    )
    return result.map(adjustUserGroupResponse)
}

/**
 * Get a groups of the particular id
 * @param groupId group id.
 * @param fields group info fields.
 * @returns resolves to the group info
 */
export const findGroupById = async (
    groupId: string,
    fields?: string[],
): Promise<UserGroup> => {
    const fieldsQuery = fields ? `?fields=${fields.join(',')}` : ''
    const result = await xhrGetAsync<UserGroup>(
        `${EnvironmentConfig.API.V5}/groups/${groupId}${fieldsQuery}`,
    )
    return adjustUserGroupResponse(result)
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
    return result.map(adjustUserGroupMemberResponse)
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
    return result.map(adjustUserGroupResponse)
}

/**
 * Create new group
 * @param data group info
 * @returns resolves to the group info
 */
/** */
export const createGroup = async (data: FormAddGroup): Promise<UserGroup> => {
    const result = await xhrPostAsync<FormAddGroup, UserGroup>(
        `${EnvironmentConfig.API.V5}/groups`,
        data,
    )
    return adjustUserGroupResponse(result)
}

/**
 * Add a member to the group specified by id
 * @param groupId group id.
 * @param entity membership entity to add.
 * @returns resolves to the groupId, if success.
 */
export const addGroupMember = async (
    groupId: string,
    entity: {
        memberId: string
        membershipType: 'user' | 'group'
    },
): Promise<string> => {
    const result = await xhrPostAsync<
        {
            memberId: string
            membershipType: 'user' | 'group'
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
export const removeGroupMember = async (
    groupId: string,
    memberId: number,
): Promise<string> => {
    const result = await xhrDeleteAsync<string>(
        `${EnvironmentConfig.API.V5}/groups/${groupId}/members/${memberId}`,
    )
    return result
}
