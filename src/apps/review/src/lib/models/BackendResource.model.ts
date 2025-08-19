import moment from 'moment'

import { getRatingColor } from '~/libs/core'

import { TABLE_DATE_FORMAT } from '../../config/index.config'

/**
 * Backend resource info
 */
export interface BackendResource {
    id: string
    challengeId: string
    memberId: string
    memberHandle: string
    roleId: string
    roleName?: string // this field is calculated at frontend
    createdBy: string
    created: string | Date
    createdString?: string // this field is calculated at frontend
    rating?: number
    handleColor?: string // this field is calculated at frontend
}

/**
 * Update backend resource to show in ui
 * @param data data from backend response
 * @returns updated data
 */
export function adjustBackendResource(
    data: BackendResource | undefined,
): BackendResource | undefined {
    if (!data) {
        return data
    }

    const created = data.created ? new Date(data.created) : data.created

    return {
        ...data,
        created,
        createdString: data.created
            ? moment(data.created)
                .local()
                .format(TABLE_DATE_FORMAT)
            : data.created,
        handleColor: getRatingColor(data.rating),
    }
}
