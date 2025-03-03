/**
 * Roles service
 */
import _ from 'lodash'

import { EnvironmentConfig } from '~/config'
import { xhrDeleteAsync, xhrGetAsync, xhrPostAsync } from '~/libs/core'

import { ApiV3Response, UserRole } from '../models'

/**
 * Fetchs roles of the specified subject
 * @param subjectId subject id.
 * @returns resolves to the array of role objects, sorted
 *  by names.
 */
export const fetchRolesBySubject = async (
    subjectId: string,
): Promise<UserRole[]> => {
    const result = await xhrGetAsync<ApiV3Response<UserRole[]>>(
        `${EnvironmentConfig.API.V3}/roles/?filter=subjectID=${subjectId}`,
    )
    return _.orderBy(result.result.content, ['roleName'], ['asc'])
}

/**
 * Fetch all roles
 * @returns resolves to the array of role objects, sorted
 *  by names.
 */
export const fetchRoles = async (): Promise<UserRole[]> => {
    const result = await xhrGetAsync<ApiV3Response<UserRole[]>>(
        `${EnvironmentConfig.API.V3}/roles`,
    )
    return _.orderBy(result.result.content, ['roleName'], ['asc'])
}

/**
 * Assigns role to the user.
 * @param roleId role id.
 * @param userId user id.
 * @returns resolves to the roleId, if success.
 */
export const assignRole = async (
    roleId: string,
    userId: string,
): Promise<string> => {
    const result = await xhrPostAsync<undefined, ApiV3Response<string>>(
        `${EnvironmentConfig.API.V3}/roles/${roleId}/assign?action=true&filter=subjectID%3D${userId}`,
        undefined,
    )
    return result.result.content
}

/**
 * Unassigns role from the user.
 * @param roleId role id.
 * @param userId user id.
 * @returns resolves to the roleId, if success.
 */
export const unassignRole = async (
    roleId: string,
    userId: string,
): Promise<string> => {
    const result = await xhrDeleteAsync<ApiV3Response<string>>(
        `${EnvironmentConfig.API.V3}/roles/${roleId}/deassign?action=true&filter=subjectID%3D${userId}`,
    )
    return result.result.content
}
