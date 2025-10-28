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
    memberEmail?: string
    roleId: string
    roleName?: string // this field is calculated at frontend
    createdBy: string
    created: string | Date
    createdString?: string // this field is calculated at frontend
    rating?: number
    maxRating?: number | null
    handleColor?: string // this field is calculated at frontend
    phaseChangeNotifications?: boolean
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
    const ratingForColor = typeof data.maxRating === 'number'
        ? data.maxRating
        : (typeof data.rating === 'number' ? data.rating : undefined)

    return {
        ...data,
        created,
        createdString: data.created
            ? moment(data.created)
                .local()
                .format(TABLE_DATE_FORMAT)
            : data.created,
        handleColor: getRatingColor(ratingForColor),
    }
}
