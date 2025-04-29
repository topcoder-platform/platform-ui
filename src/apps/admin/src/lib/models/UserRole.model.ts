import moment from 'moment'

import { TABLE_DATE_FORMAT } from '../../config/index.config'

/**
 * Model for user role info
 */
export interface UserRole {
    id: string
    roleName: string
    createdBy?: string
    createdByHandle?: string
    createdAt: Date
    createdAtString?: string
    modifiedBy?: string
    modifiedAt: Date
    modifiedAtString?: string
    modifiedByHandle?: string
    subjects?: {
        email: string | null
        handle: string | null
        userId: string
    }[]
}

/**
 * Update user role to show in ui
 * @param data data from backend response
 * @returns updated user role info
 */
export function adjustUserRoleResponse(data: UserRole): UserRole {
    const createdAt = data.createdAt ? new Date(data.createdAt) : data.createdAt
    const modifiedAt = data.modifiedAt
        ? new Date(data.modifiedAt)
        : data.modifiedAt
    return {
        ...data,
        createdAt,
        createdAtString: data.createdAt
            ? moment(data.createdAt)
                .local()
                .format(TABLE_DATE_FORMAT)
            : data.createdAt,
        modifiedAt,
        modifiedAtString: data.modifiedAt
            ? moment(data.modifiedAt)
                .local()
                .format(TABLE_DATE_FORMAT)
            : data.modifiedAt,
    }
}
