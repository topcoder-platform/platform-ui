import { adjustReviewInfo, ReviewInfo } from './ReviewInfo.model'
import { ReviewResult } from './ReviewResult.model'

/**
 * Challenge submission info
 */
export interface SubmissionInfo {
    id: string
    handle: string
    handleColor: string
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
        review: adjustReviewInfo(data.review),
    }
}
