/**
 * Roles service
 */
import _ from 'lodash'

import { EnvironmentConfig } from '~/config'
import { xhrDeleteAsync, xhrGetAsync, xhrPostAsync } from '~/libs/core'

import { adjustUserRoleResponse, ApiV3Response, UserRole } from '../models'

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
    const roles = result.result.content.map(adjustUserRoleResponse)
    return _.orderBy(roles, ['roleName'], ['asc'])
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
    const roles = result.result.content.map(adjustUserRoleResponse)
    return _.orderBy(roles, ['roleName'], ['asc'])
}

/**
 * Create role.
 * @param roleName role name.
 * @returns resolves to the role object, if success.
 */
export const createRole = async (roleName: string): Promise<UserRole> => {
    const result = await xhrPostAsync<any, ApiV3Response<UserRole>>(
        `${EnvironmentConfig.API.V3}/roles`,
        {
            param: {
                roleName,
            },
        },
    )
    return adjustUserRoleResponse(result.result.content)
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
    // there is a bug in backend, when we ask to get role subjects
    // but there are no subjects, backend returns 404 even if role exists
    // as a workaround we get role without subjects first to check if it exists
    // and only after we try to get it subject
    // TODO: remove code in this if, after this bug is fixed at the backend
    //       keep only the part after else
    if (fields && _.includes(fields, 'subjects')) {
        const fieldsWithouSubjects = _.without(fields, 'subjects')
        // if there are no fields after removing 'subjects', add 'id' to retrieve minimum data
        if (!fieldsWithouSubjects.length) {
            fieldsWithouSubjects.push('id')
        }

        const fieldsQuery = fields
            ? `?fields=${fieldsWithouSubjects.join(',')}`
            : ''

        return xhrGetAsync<ApiV3Response<UserRole>>(
            `${EnvironmentConfig.API.V3}/roles/${roleId}${fieldsQuery}`,
        )
            .then(async (res: ApiV3Response<UserRole>) => {
                const roleWithoutSubjects = res.result.content

                // now let's try to get subjects
                return xhrGetAsync<ApiV3Response<UserRole>>(
                    `${EnvironmentConfig.API.V3}/roles/${roleId}?fields=subjects`,
                )
                // populate role with subjects and return it
                    .then((resChild: ApiV3Response<UserRole>) => _.assign(
                        roleWithoutSubjects,
                        {
                            subjects: resChild.result.content.subjects,
                        },
                    ))
                    .catch((error: any) => {
                        // if get error 404 in this case we know role exits
                        // so just return roleWithoutSubjects with subjects as en empty array
                        if (
                            error.data
                            && error.data.result
                            && error.data.result.status === 404
                        ) {
                            return adjustUserRoleResponse(
                                _.assign(roleWithoutSubjects, {
                                    subjects: [],
                                }),
                            )

                        }

                        // for other errors return rejected promise with error
                        return Promise.reject(error)
                    })
            })

    }

    // if don't ask for subjects, then just normal request
    const fieldsQuery = fields ? `?fields=${fields.join(',')}` : ''
    const result = await xhrGetAsync<ApiV3Response<UserRole>>(
        `${EnvironmentConfig.API.V3}/roles/${roleId}${fieldsQuery}`,
    )
    return adjustUserRoleResponse(result.result.content)
}
