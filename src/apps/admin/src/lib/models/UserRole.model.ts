import moment from 'moment'

import { TABLE_DATE_FORMAT } from '../../config/index.config'

/**
 * Model for user role info
 */
export interface UserRole {
    id: string | number
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
        email?: null | string
        handle?: null | string
        userId?: null | number
    }[]
}

/**
 * Update user role to show in ui
 * @param data data from backend response
 * @returns updated user role info
 */
export function adjustUserRoleResponse(data: UserRole): UserRole {
    const createdAt = data.createdAt ? new Date(data.createdAt) : data.createdAt
    // Backend may return updated* fields instead of modified*
    const updatedAtRaw = (data as any).updatedAt
    const updatedByRaw = (data as any).updatedBy
    const modifiedAtSource: any = data.modifiedAt ?? updatedAtRaw
    const modifiedBySource: any = data.modifiedBy ?? updatedByRaw
    const modifiedAt = modifiedAtSource ? new Date(modifiedAtSource) : modifiedAtSource
    return {
        ...data,
        createdAt,
        createdAtString: data.createdAt
            ? moment(data.createdAt)
                .local()
                .format(TABLE_DATE_FORMAT)
            : data.createdAt,
        // Normalize to modified* so UI consistently renders
        modifiedAt,
        modifiedAtString: data.modifiedAt
            ? moment(data.modifiedAt)
                .local()
                .format(TABLE_DATE_FORMAT)
            : (modifiedAtSource
                ? moment(modifiedAtSource)
                    .local()
                    .format(TABLE_DATE_FORMAT)
                : data.modifiedAt),
        modifiedBy: modifiedBySource,
    }
}
