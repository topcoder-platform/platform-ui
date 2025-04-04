import moment from 'moment'

import { TABLE_DATE_FORMAT } from '../../config/index.config'

import { AppealResult } from './AppealResult.model'

/**
 * Review result info
 */
export interface ReviewResult {
    score: number
    appeals: AppealResult[]
    reviewerHandle: string
    reviewerHandleColor: string
    createdAt: string | Date
    createdAtString?: string // this field is calculated at frontend
}

/**
 * Update review result to show in ui
 * @param data data from backend response
 * @returns updated data
 */
export function adjustReviewResult(
    data: ReviewResult | undefined,
): ReviewResult | undefined {
    if (!data) {
        return data
    }

    const createdAt = data.createdAt ? new Date(data.createdAt) : data.createdAt

    return {
        ...data,
        createdAt,
        createdAtString: data.createdAt
            ? moment(data.createdAt)
                .local()
                .format(TABLE_DATE_FORMAT)
            : data.createdAt,
    }
}
