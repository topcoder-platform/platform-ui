import * as Yup from 'yup'

import {
    FormEditUserEmail,
    FormEditUserGroup,
    FormEditUserRole,
    FormSearchByKey,
    FormUsersFilters,
} from '../models'
import { FormEditUserStatus } from '../models/FormEditUserStatus.model'

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
