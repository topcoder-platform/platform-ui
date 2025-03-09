import * as Yup from 'yup'

import {
    FormAddGroup,
    FormAddGroupMembers,
    FormEditUserEmail,
    FormEditUserGroup,
    FormEditUserRole,
    FormGroupMembersFilters,
    FormRoleMembersFilters,
    FormRolesFilter,
    FormSearchByKey,
    FormUsersFilters,
} from '../models'
import { FormEditUserStatus } from '../models/FormEditUserStatus.model'
import { FormAddRoleMembers } from '../models/FormAddRoleMembers.type'

/**
 * validation schema for form filter users
 */
export const formUsersFiltersSchema: Yup.ObjectSchema<FormUsersFilters>
    = Yup.object({
        email: Yup.string()
            .trim()
            .optional(),
        handle: Yup.string()
            .optional(),
        status: Yup.string()
            .optional(),
        userId: Yup.string()
            .optional(),
    })

/**
 * validation schema for form role members filters
 */
export const formRoleMembersFiltersSchema: Yup.ObjectSchema<FormRoleMembersFilters>
    = Yup.object({
        userHandle: Yup.string()
            .trim()
            .optional(),
        userId: Yup.string()
            .trim()
            .optional(),
    })

/**
 * validation schema for form group members filters
 */
export const formGroupMembersFiltersSchema: Yup.ObjectSchema<FormGroupMembersFilters>
    = Yup.object({
        createdAtFrom: Yup.date()
            .optional()
            .nullable(),
        createdAtTo: Yup.date()
            .optional()
            .nullable(),
        createdBy: Yup.string()
            .trim()
            .optional(),
        memberId: Yup.string()
            .trim()
            .optional(),
        memberName: Yup.string()
            .trim()
            .optional(),
        modifiedAtFrom: Yup.date()
            .optional()
            .nullable(),
        modifiedAtTo: Yup.date()
            .optional()
            .nullable(),
        modifiedBy: Yup.string()
            .trim()
            .optional(),
    })

/**
 * validation schema for form filter roles
 */
export const formRolesFilterSchema: Yup.ObjectSchema<FormRolesFilter>
    = Yup.object({
        roleName: Yup.string()
            .trim()
            .required('Role is required.'),
    })

/**
 * validation schema for form add role members
 */
export const formAddRoleMembersSchema: Yup.ObjectSchema<FormAddRoleMembers>
    = Yup.object({
        userHandles: Yup.array()
            .of(
                Yup.object()
                    .shape({
                        handle: Yup.string()
                            .required('Handle is required.'),
                        userId: Yup.number()
                            .required('User id is required.'),
                    }),
            )
            .required('Please choose at least one user handle.')
            .min(1, 'Please choose at least one user handle.'),
    })

/**
 * validation schema for form add group members
 */
export const formAddGroupMembersSchema: Yup.ObjectSchema<FormAddGroupMembers>
    = Yup.object({
        groupIds: Yup.array()
            .of(
                Yup.object()
                    .shape({
                        label: Yup.string()
                            .required('label id is required.'),
                        value: Yup.string()
                            .required('value is required.'),
                    }),
            )
            .when('membershipType', (membershipType, schema) => {
                if (membershipType[0] === 'group') {
                    return schema
                        .required('Please choose at least one group id.')
                        .min(1, 'Please choose at least one group id.')
                }

                return schema
            }),
        membershipType: Yup.string()
            .trim()
            .required('membershipType is required.'),
        userHandles: Yup.array()
            .of(
                Yup.object()
                    .shape({
                        handle: Yup.string()
                            .required('Handle is required.'),
                        userId: Yup.number()
                            .required('User id is required.'),
                    }),
            )
            .when('membershipType', (membershipType, schema) => {
                if (membershipType[0] === 'user') {
                    return schema
                        .required('Please choose at least one user handle.')
                        .min(1, 'Please choose at least one user handle.')
                }

                return schema
            }),
    })

/**
 * validation schema for form edit user email
 */
export const formEditUserEmailSchema: Yup.ObjectSchema<FormEditUserEmail>
    = Yup.object({
        email: Yup.string()
            .trim()
            .email('Invalid email address.')
            .required('Email address is required.'),
    })

/**
 * validation schema for form add group
 */
export const formAddGroupSchema: Yup.ObjectSchema<FormAddGroup>
    = Yup.object({
        description: Yup.string()
            .trim()
            .optional(),
        name: Yup.string()
            .trim()
            .required('Name is required.'),
        privateGroup: Yup.boolean()
            .optional(),
        selfRegister: Yup.boolean()
            .optional(),
    })

/**
 * validation schema for form edit user status
 * @param previousStatus
 * @returns form schema
 */
export function formEditUserStatusSchema(
    previousStatus: string,
): Yup.ObjectSchema<FormEditUserStatus> {
    return Yup.object({
        comment: Yup.string()
            .trim()
            .optional(),
        status: Yup.string()
            .trim()
            .required('Status is required.')
            .test(
                'StatusNotChanged',
                'Status is not changed.',
                value => value !== previousStatus,
            ),
    })
}

/**
 * validation schema for form add user role
 */
export const formEditUserRoleSchema: Yup.ObjectSchema<FormEditUserRole>
    = Yup.object({
        role: Yup.string()
            .trim()
            .required('Role is required.'),
    })

/**
 * validation schema for form add user group
 */
export const formEditUserGroupSchema: Yup.ObjectSchema<FormEditUserGroup>
    = Yup.object({
        group: Yup.string()
            .trim()
            .required('Group is required.'),
    })

/**
 * validation schema for form search by key
 */
export const formSearchByKeySchema: Yup.ObjectSchema<FormSearchByKey>
    = Yup.object({
        searchKey: Yup.string()
            .trim()
            .optional(),
    })
