/**
 * Roles service
 */
import _ from 'lodash'

import { EnvironmentConfig } from '~/config'
import {
    xhrDeleteAsync,
    xhrGetAsync,
    xhrPatchAsync,
    xhrPostAsync,
} from '~/libs/core'

import { adjustUserRoleResponse, UserRole } from '../models'

/**
 * Fetchs roles of the specified subject
 * @param subjectId subject id.
 * @returns resolves to the array of role objects, sorted
 *  by names.
 */
export const fetchRolesBySubject = async (
    subjectId: string,
): Promise<UserRole[]> => {
    const roles = await xhrGetAsync<UserRole[]>(
        `${EnvironmentConfig.API.V6}/roles/?filter=subjectID=${subjectId}`,
    )
    const adjusted = roles.map(adjustUserRoleResponse)
    return _.orderBy(adjusted, ['roleName'], ['asc'])
}

/**
 * Fetch all roles
 * @returns resolves to the array of role objects, sorted
 *  by names.
 */
export const fetchRoles = async (): Promise<UserRole[]> => {
    const roles = await xhrGetAsync<UserRole[]>(
        `${EnvironmentConfig.API.V6}/roles`,
    )
    const adjusted = roles.map(adjustUserRoleResponse)
    return _.orderBy(adjusted, ['roleName'], ['asc'])
}

/**
 * Create role.
 * @param roleName role name.
 * @returns resolves to the role object, if success.
 */
export const createRole = async (roleName: string): Promise<UserRole> => {
    const response = await xhrPostAsync<any, UserRole>(
        `${EnvironmentConfig.API.V6}/roles`,
        {
            param: {
                roleName,
            },
        },
    )
    return adjustUserRoleResponse(response)
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
): Promise<string> => xhrPatchAsync<{ roleId: string }, string>(
    `${EnvironmentConfig.API.V6}/user-roles/${userId}`,
    { roleId },
)

/**
 * Unassigns role from the user.
 * @param roleId role id.
 * @param userId user id.
 * @returns resolves to the roleId, if success.
 */
export const unassignRole = async (
    roleId: string,
    userId: string,
): Promise<string> => xhrDeleteAsync<string>(
    `${EnvironmentConfig.API.V6}/user-roles/${userId}/${roleId}`,
)

/**
 * Fetchs role info
 * @param roleId role id.
 * @param fields role info fields.
 * @returns resolves to the role object.
 */
export const fetchRole = async (
    roleId: string,
    fields: string[],
): Promise<UserRole> => {
    const baseUrl = `${EnvironmentConfig.API.V6}/roles/${roleId}`

    if (fields && _.includes(fields, 'subjects')) {
        // Work around backend returning 404 when requesting subjects for empty roles.
        const fieldsWithoutSubjects = _.without(fields, 'subjects')
        if (!fieldsWithoutSubjects.length) {
            fieldsWithoutSubjects.push('id')
        }

        const fieldsQuery = `?fields=${fieldsWithoutSubjects.join(',')}`
        const roleWithoutSubjects = await xhrGetAsync<UserRole>(
            `${baseUrl}${fieldsQuery}`,
        )

        try {
            const subjectsResponse = await xhrGetAsync<UserRole>(
                `${baseUrl}?fields=subjects`,
            )
            const mergedRole = _.assign({}, roleWithoutSubjects, {
                subjects: subjectsResponse.subjects,
            })
            return adjustUserRoleResponse(mergedRole)
        } catch (error: any) {
            const statusCode = error?.data?.result?.status
                ?? error?.response?.status
                ?? error?.status

            if (statusCode === 404) {
                return adjustUserRoleResponse(
                    _.assign({}, roleWithoutSubjects, { subjects: [] }),
                )
            }

            throw error
        }
    }

    const fieldsQuery = fields?.length ? `?fields=${fields.join(',')}` : ''
    const response = await xhrGetAsync<UserRole>(
        `${baseUrl}${fieldsQuery}`,
    )
    return adjustUserRoleResponse(response)
}
