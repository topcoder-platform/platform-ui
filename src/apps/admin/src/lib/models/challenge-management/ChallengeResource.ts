import moment from 'moment'

import { TABLE_DATE_FORMAT } from '../../../config/index.config'

export interface ResourceRole {
    id: string
    name: string
}

export interface ResourceEmail {
    userId: number
    email: string
}

export interface ChallengeResource {
    id: number
    memberId: string
    memberHandle: string
    roleId: ResourceRole['id']
    created: string
    createdDate?: Date
    createdString?: string // this field is calculated at frontend
    createdBy: string
}

/**
 * Update challenge resource to show in ui
 * @param data data from backend response
 * @returns updated data
 */
export function adjustChallengeResource(
    data: ChallengeResource,
): ChallengeResource {
    if (!data) {
        return data
    }

    const created = data.created
        ? new Date(data.created)
        : undefined

    return {
        ...data,
        createdDate: created,
        createdString: created
            ? moment(created)
                .local()
                .format(TABLE_DATE_FORMAT)
            : undefined,
    }
}
