import moment from 'moment'

import { TABLE_DATE_FORMAT } from '../../config/index.config'

import { adjustReviewResult, ReviewResult } from './ReviewResult.model'
import { BackendProjectResult } from './BackendProjectResult.model'
import { BackendResource } from './BackendResource.model'

/**
 * Project result info
 */
export interface ProjectResult {
    challengeId: string
    submissionId: string
    createdAt: string | Date
    createdAtString?: string // this field is calculated at frontend
    /**
     * The date/time when the winning submission was created.
     */
    submittedDate?: string | Date
    /**
     * Localized string for the submitted date, computed on frontend.
     */
    submittedDateString?: string
    initialScore: number
    placement: number
    finalScore: number
    reviews: ReviewResult[]
    userId: string
    userInfo?: BackendResource
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
    const submittedDate = data.submittedDate
        ? (data.submittedDate instanceof Date ? data.submittedDate : new Date(data.submittedDate))
        : undefined

    return {
        ...data,
        createdAt,
        createdAtString: data.createdAt
            ? moment(data.createdAt)
                .local()
                .format(TABLE_DATE_FORMAT)
            : data.createdAt,
        reviews: data.reviews.map(adjustReviewResult) as ReviewResult[],
        submittedDate,
        submittedDateString: submittedDate
            ? moment(submittedDate)
                .local()
                .format(TABLE_DATE_FORMAT)
            : data.submittedDateString,
    }
}

/**
 * Convert backend project results to show in ui
 *
 * @param data data from backend response
 * @returns updated data
 */
export function convertBackendProjectResultToProjectResult(
    data: BackendProjectResult,
): ProjectResult {
    const createdAt = new Date(data.createdAt)
    const createdAtString = createdAt
        ? moment(createdAt)
            .local()
            .format(TABLE_DATE_FORMAT)
        : undefined

    return {
        challengeId: data.challengeId,
        createdAt,
        createdAtString,
        finalScore: data.finalScore,
        initialScore: data.initialScore,
        placement: data.placement,
        reviews: [],
        submissionId: data.submissionId,
        userId: data.userId,
    }
}
