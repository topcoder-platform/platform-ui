import moment from 'moment'

import { getRatingColor } from '~/libs/core'

import { TABLE_DATE_FORMAT } from '../../config/index.config'

import { AppealResult } from './AppealResult.model'
import { BackendReview } from './BackendReview.model'

/**
 * Review result info
 */
export interface ReviewResult {
    appeals: AppealResult[]
    createdAt: string | Date
    createdAtString?: string // this field is calculated at frontend
    resourceId: string
    reviewDate?: string | Date
    reviewDateString?: string // this field is calculated at frontend
    reviewerHandle: string
    reviewerHandleColor: string
    reviewerMaxRating?: number | null
    score: number
}

const normalizeScoreValue = (value: number | string | null | undefined): number | undefined => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : undefined
    }

    if (typeof value === 'string') {
        const trimmed = value.trim()
        if (!trimmed) {
            return undefined
        }

        const parsed = Number.parseFloat(trimmed)
        return Number.isFinite(parsed) ? parsed : undefined
    }

    return undefined
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
    const reviewDate = data.reviewDate ? new Date(data.reviewDate) : undefined

    return {
        ...data,
        createdAt,
        createdAtString: data.createdAt
            ? moment(data.createdAt)
                .local()
                .format(TABLE_DATE_FORMAT)
            : data.createdAt,
        reviewDate,
        reviewDateString: reviewDate
            ? moment(reviewDate)
                .local()
                .format(TABLE_DATE_FORMAT)
            : (typeof data.reviewDate === 'string' ? data.reviewDate : undefined),
        reviewerHandle: data.reviewerHandle,
        reviewerHandleColor: data.reviewerMaxRating
            ? getRatingColor(data.reviewerMaxRating)
            : data.reviewerHandleColor,
        reviewerMaxRating: data.reviewerMaxRating,
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
    const reviewDate = data.reviewDate ? new Date(data.reviewDate) : undefined
    const reviewDateString = data.reviewDate
        ? moment(data.reviewDate)
            .local()
            .format(TABLE_DATE_FORMAT)
        : undefined
    const reviewerHandle = data.reviewerHandle?.trim() || undefined
    const reviewerMaxRating = data.reviewerMaxRating ?? undefined

    return {
        appeals: [],
        createdAt,
        createdAtString,
        resourceId: data.resourceId,
        reviewDate,
        reviewDateString,
        reviewerHandle: reviewerHandle ?? '',
        reviewerHandleColor: reviewerMaxRating && reviewerHandle
            ? getRatingColor(reviewerMaxRating)
            : '#2a2a2a',
        reviewerMaxRating,
        score: normalizeScoreValue(data.finalScore) ?? 0,
    }
}
