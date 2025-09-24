import moment from 'moment'

import { TABLE_DATE_FORMAT } from '../../config/index.config'

/**
 * Model for user group info
 */
export interface UserGroup {
    id: string
    name: string
    description: string
    createdBy: string
    createdByHandle?: string
    createdAt: Date
    createdAtString?: string
    updatedBy: string
    updatedByHandle?: string
    updatedAt: Date
    updatedAtString?: string
}

/**
 * Update user group to show in ui
 * @param data data from backend response
 * @returns updated user group info
 */
export function adjustUserGroupResponse(data: UserGroup): UserGroup {
    const createdAt = data.createdAt ? new Date(data.createdAt) : data.createdAt
    const updatedAt = data.updatedAt ? new Date(data.updatedAt) : data.updatedAt
    return {
        ...data,
        createdAt,
        createdAtString: data.createdAt
            ? moment(data.createdAt)
                .local()
                .format(TABLE_DATE_FORMAT)
            : data.createdAt,
        updatedAt,
        updatedAtString: data.updatedAt
            ? moment(data.updatedAt)
                .local()
                .format(TABLE_DATE_FORMAT)
            : data.updatedAt,
    }
}
