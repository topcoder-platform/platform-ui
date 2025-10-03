/**
 * Model for submission review info
 */
export interface SubmissionReview {
    id: string
    submissionId: string
    score?: number | null
    initialScore?: number | null
    finalScore?: number | null
    scorecardId?: string | null
    typeId?: string | null
    status?: string | null
    reviewerId?: string | null
    reviewerHandle?: string | null
    createdBy: string | null
    created?: Date | string | null
    createdAt?: Date | string | null
    updatedBy: string | null
    updated?: Date | string | null
    updatedAt?: Date | string | null
    reviewedDate?: Date | string | null
    reviewDate?: Date | string | null
    metadata?: {
        testType?: 'provisional' | 'example'
        [key: string]: any
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
    const normalizeDate = (
        value?: Date | string | null,
    ): Date | undefined => {
        // Treat both undefined and null as absent values
        if (value === undefined || value === null) {
            return undefined
        }

        return value instanceof Date ? value : new Date(value)
    }

    const createdRaw = data.createdAt ?? data.created ?? undefined
    const updatedRaw = data.updatedAt ?? data.updated ?? undefined
    const reviewDateRaw = data.reviewDate ?? data.reviewedDate ?? undefined

    const created = normalizeDate(createdRaw)
    const updated = normalizeDate(updatedRaw)
    const reviewDate = normalizeDate(reviewDateRaw)

    return {
        ...data,
        created,
        createdAt: createdRaw ?? undefined,
        reviewDate,
        reviewedDate: reviewDate,
        updated,
        updatedAt: updatedRaw ?? undefined,
    }
}
