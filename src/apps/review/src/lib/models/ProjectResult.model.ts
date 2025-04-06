import moment from 'moment'

import { TABLE_DATE_FORMAT } from '../../config/index.config'

import { adjustReviewResult, ReviewResult } from './ReviewResult.model'

/**
 * Project result info
 */
export interface ProjectResult {
    challengeId: string
    submissionId: string
    createdAt: string | Date
    createdAtString?: string // this field is calculated at frontend
    handle: string
    handleColor: string
    initialScore: number
    placement: number
    finalScore: number
    reviews: ReviewResult[]
}

/**
 * Update project result to show in ui
 * @param data data from backend response
 * @returns updated data
 */
export function adjustProjectResult(
    data: ProjectResult | undefined,
): ProjectResult | undefined {
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
        reviews: data.reviews.map(adjustReviewResult) as ReviewResult[],
    }
}
