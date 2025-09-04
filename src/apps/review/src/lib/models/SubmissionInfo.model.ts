import { BackendResource } from './BackendResource.model'
import { BackendSubmission } from './BackendSubmission.model'
import {
    adjustReviewInfo,
    convertBackendReviewToReviewInfo,
    ReviewInfo,
} from './ReviewInfo.model'
import {
    convertBackendReviewToReviewResult,
    ReviewResult,
} from './ReviewResult.model'

/**
 * Challenge submission info
 */
export interface SubmissionInfo {
    id: string
    memberId: string
    userInfo?: BackendResource // this field is calculated at frontend
    review?: ReviewInfo
    reviews?: ReviewResult[]
}

/**
 * Update review info to show in ui
 * @param data data from backend response
 * @returns updated data
 */
export function adjustSubmissionInfo(
    data: SubmissionInfo | undefined,
): SubmissionInfo | undefined {
    if (!data) {
        return data
    }

    return {
        ...data,
        review: data.review ? adjustReviewInfo(data.review) : undefined,
    }
}

/**
 * Convert backend submission info to show in review table
 *
 * @param data data from backend response
 * @returns updated data
 */
export function convertBackendSubmissionToSubmissionInfo(
    data: BackendSubmission,
): SubmissionInfo {
    return {
        id: data.id,
        memberId: data.memberId,
        review:
            data.review && data.review[0]
                ? convertBackendReviewToReviewInfo(data.review[0], data)
                : undefined,
        reviews: data.review.map(convertBackendReviewToReviewResult),
    }
}
