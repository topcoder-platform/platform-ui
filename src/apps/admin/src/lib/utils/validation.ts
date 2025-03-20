import * as Yup from 'yup'
import _ from 'lodash'

import {
    FormAddGroup,
    FormAddGroupMembers,
    FormBillingAccountsFilter,
    FormClientsFilter,
    FormEditBillingAccount,
    FormEditClient,
    FormEditUserEmail,
    FormEditUserGroup,
    FormEditUserRole,
    FormGroupMembersFilters,
    FormNewBillingAccountResource,
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
 * validation schema for form billing accounts filter
 */
export const formBillingAccountsFilterSchema: Yup.ObjectSchema<FormBillingAccountsFilter>
    = Yup.object({
        endDate: Yup.date()
            .nullable()
            .optional(),
        name: Yup.string()
            .trim()
            .optional(),
        startDate: Yup.date()
            .nullable()
            .optional(),
        status: Yup.string()
            .trim()
            .optional(),
        user: Yup.string()
            .trim()
            .optional(),
    })

/**
 * validation schema for form clients filter
 */
export const formClientsFilterSchema: Yup.ObjectSchema<FormClientsFilter>
    = Yup.object({
        endDate: Yup.date()
            .nullable()
            .optional(),
        name: Yup.string()
            .trim()
            .optional(),
        startDate: Yup.date()
            .nullable()
            .optional(),
        status: Yup.string()
            .trim()
            .optional(),
    })

/**
 * validation schema for form new billing account resource
 */
export const formNewBillingAccountResourceSchema: Yup.ObjectSchema<FormNewBillingAccountResource>
    = Yup.object({
        name: Yup.string()
            .trim()
            .required('TC handle is required.'),
        status: Yup.string()
            .trim()
            .required('Status is required.'),
        userId: Yup.string()
            .trim()
            .required('Can not find ID with TC handle.'),
    })

/**
 * check if value is number
 * @param value value
 * @returns is valid number value
 */
export function isValidNumber(value: number | undefined): boolean {
    return _.isNumber(value)
}

/**
 * validation schema for form new billing account
 */
export const formEditBillingAccountSchema: Yup.ObjectSchema<FormEditBillingAccount>
    = Yup.object({
        budgetAmount: Yup.number()
            .transform(value => (Number.isNaN(value) ? undefined : value))
            .optional()
            .typeError('Invalid number.')
            .min(1, 'Budget amount must be greater than or equal 1.'),
        client: Yup.object()
            .shape({
                id: Yup.number()
                    .typeError('Invalid number.')
                    .required('Id is required.'),
                name: Yup.string()
                    .required('Name is required.'),
            })
            .default(undefined)
            .required('Client is required.'),
        companyId: Yup.number()
            .typeError('Invalid number.')
            .required('Customer number is required.')
            .min(1, 'Customer number must be greater than or equal 1.'),
        description: Yup.string()
            .trim()
            .required('Description is required.'),
        endDate: Yup.date()
            .required('End date is required.'),
        name: Yup.string()
            .trim()
            .required('Name is required.'),
        paymentTerms: Yup.number()
            .typeError('Invalid number.')
            .required('Payment terms is required.')
            .min(1, 'Payment terms must be greater than or equal 1.'),
        poNumber: Yup.string()
            .trim()
            .required('PO Number is required.'),
        salesTax: Yup.number()
            .required('Sales tax is required.'),
        startDate: Yup.date()
            .required('Start date is required.'),
        status: Yup.string()
            .required('Status is required.'),
        subscriptionNumber: Yup.number()
            .transform(value => (Number.isNaN(value) ? undefined : value))
            .optional()
            .typeError('Invalid number.')
            .min(1, 'Subscription number must be greater than or equal 1.'),
    })

/**
 * validation schema for form new billing account
 */
export const formEditClientSchema: Yup.ObjectSchema<FormEditClient>
    = Yup.object({
        codeName: Yup.string()
            .trim()
            .optional(),
        endDate: Yup.date()
            .required('End date is required.'),
        name: Yup.string()
            .trim()
            .required('Name is required.'),
        startDate: Yup.date()
            .required('Start date is required.'),
        status: Yup.string()
            .required('Status is required.'),
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
