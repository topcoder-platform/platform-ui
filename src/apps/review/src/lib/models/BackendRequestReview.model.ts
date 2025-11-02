/**
 * Backend request to create new review
 */

import { BackendRequestReviewItem } from './BackendRequestReviewItem.model'

export interface BackendRequestReviewBase {
    resourceId: string
    phaseId: string
    submissionId: string
    scorecardId: string
    finalScore: number
    initialScore: number
    typeId: string
    status: string
    reviewDate: string
    committed?: boolean
}

export interface BackendRequestReview extends BackendRequestReviewBase {
    reviewItems: BackendRequestReviewItem[]
}
