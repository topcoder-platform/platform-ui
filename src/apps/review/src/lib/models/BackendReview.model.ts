import { BackendReviewItem } from './BackendReviewItem.model'

/**
 * Backend model for review
 */
export interface BackendReview {
    id: string
    legacyId: string
    resourceId: string
    phaseId: string
    submissionId: string
    legacySubmissionId: string
    scorecardId: string
    committed: boolean
    finalScore: number
    initialScore: number
    typeId: string | null
    metadata: string | null
    status: string | null
    reviewDate: string | null
    createdAt: string
    createdAtDate?: Date // this field is calculated at frontend
    createdBy: string
    updatedAt: string
    updatedBy: string
    reviewerHandle?: string | null
    reviewerMaxRating?: number | null
    reviewItems?: BackendReviewItem[]
}

export function createEmptyBackendReview(): BackendReview {
    return {
        committed: false,
        createdAt: '',
        createdBy: '',
        finalScore: 0,
        id: '',
        initialScore: 0,
        legacyId: '',
        legacySubmissionId: '',
        metadata: '',
        phaseId: '',
        resourceId: '',
        reviewDate: '',
        scorecardId: '',
        status: '',
        submissionId: '',
        typeId: '',
        updatedAt: '',
        updatedBy: '',

    }
}

/**
 * Update submission info to show in ui
 *
 * @param data data from backend response
 * @returns updated data
 */
export function adjustBackendReview(data: BackendReview): BackendReview {
    const createdAt = data.createdAt
    const createdAtDate: undefined | Date = createdAt
        ? new Date(createdAt)
        : undefined

    return {
        ...data,
        createdAtDate,
    }
}
