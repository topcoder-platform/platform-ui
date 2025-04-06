import { QUESTION_RESPONSE_TYPE_MAPPING_DISPLAY } from '../../config/index.config'

/**
 * Review Item Comment
 */
export interface ReviewItemComment {
    id: string
    content: string
    type: string
    sortOrder: number
    typeDisplay?: string // this field is calculated at frontend
}

/**
 * Update review item comment info to show in ui
 * @param data data from backend response
 * @returns updated data
 */
export function adjustReviewItemComment(
    data: ReviewItemComment | undefined,
): ReviewItemComment | undefined {
    if (!data) {
        return data
    }

    const typeDisplay
        = QUESTION_RESPONSE_TYPE_MAPPING_DISPLAY[data.type] ?? data.type

    return {
        ...data,
        typeDisplay,
    }
}
