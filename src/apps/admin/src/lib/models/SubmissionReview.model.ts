/**
 * Model for submission review info
 */
export interface SubmissionReview {
    score: number
    updatedBy: string
    reviewerId: string
    submissionId: string
    createdBy: string
    created: Date
    scoreCardId: number
    typeId: string
    id: string
    reviewedDate: Date
    updated: Date
    status: string
    metadata?: {
        testType: 'provisional' | 'example'
    }
}

/**
 * Update submission review to show in ui
 * @param data data from backend response
 * @returns updated data
 */
export function adjustSubmissionReviewResponse(
    data: SubmissionReview,
): SubmissionReview {
    const created = data.created ? new Date(data.created) : data.created
    const reviewedDate = data.created
        ? new Date(data.reviewedDate)
        : data.reviewedDate
    const updated = data.created ? new Date(data.updated) : data.updated

    return {
        ...data,
        created,
        reviewedDate,
        updated,
    }
}
