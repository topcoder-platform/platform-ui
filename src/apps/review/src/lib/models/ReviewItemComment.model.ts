import { QUESTION_RESPONSE_TYPE_MAPPING_DISPLAY } from '../../config/index.config'

import { AppealInfo } from './AppealInfo.model'

/**
 * Review Item Comment
 */
export interface ReviewItemComment {
    id: string
    content: string
    type: string
    sortOrder: number
    typeDisplay?: string // this field is calculated at frontend
    appeal?: AppealInfo
}

/**
 * Update review item comment info to show in ui
 * @param data data from backend response
 * @returns updated data
 */
export function adjustReviewItemComment(
    data: ReviewItemComment,
): ReviewItemComment {
    const typeDisplay
        = QUESTION_RESPONSE_TYPE_MAPPING_DISPLAY[data.type] ?? data.type

    return {
        ...data,
        typeDisplay,
    }
}
