import moment from 'moment'

import { TABLE_DATE_FORMAT } from '../../config/index.config'

import { AppealResult } from './AppealResult.model'
import { BackendReview } from './BackendReview.model'

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
    resourceId: string
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

/**
 * Convert backend review info to show in review ui
 *
 * @param data data from backend response
 * @returns updated data
 */
export function convertBackendReviewToReviewResult(
    data: BackendReview,
): ReviewResult {
    const createdAt = new Date(data.createdAt)
    const createdAtString = createdAt
        ? moment(createdAt)
            .local()
            .format(TABLE_DATE_FORMAT)
        : undefined

    return {
        appeals: [],
        createdAt,
        createdAtString,
        resourceId: data.resourceId,
        reviewerHandle: '',
        reviewerHandleColor: '#2a2a2a',
        score: data.finalScore,
    }
}
