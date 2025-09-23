import { forEach, orderBy } from 'lodash'

import { adjustBackendReview, BackendReview } from './BackendReview.model'
import { BackendSubmissionStatus } from './BackendSubmissionStatus.enum'

/**
 * Backend model for submission
 */
export interface BackendSubmission {
    id: string
    legacySubmissionId: string
    type: string
    status: BackendSubmissionStatus
    screeningScore: string | null
    initialScore: string
    finalScore: string
    placement: number
    userRank: number
    markForPurchase: boolean
    prizeId: number
    fileSize: number | null
    viewCount: number | null
    systemFileName: string | null
    thurgoodJobId: string | null
    url: string
    memberId: string
    challengeId: string
    legacyChallengeId: number
    submissionPhaseId: string
    fileType: string
    esId: string
    submittedDate: string
    createdAt: string
    createdBy: string
    updatedAt: string
    updatedBy: string
    legacyUploadId: string
    uploadId: string
    review: BackendReview[]
    reviewSummation: any[]
    reviewResourceMapping?: { [resourceId: string]: BackendReview } // this field is calculated at frontend
}

/**
 * Update submission info to show in ui
 *
 * @param data data from backend response
 * @returns updated data
 */
export function adjustBackendSubmission(
    data: BackendSubmission,
): BackendSubmission {
    const review = orderBy(data.review.map(adjustBackendReview), ['createdAtDate'], ['desc'])
    const listOfValidReview: BackendReview[] = []
    const reviewResourceMapping: { [resourceId: string]: BackendReview } = {}
    forEach(review, reviewItem => {
        if (!reviewResourceMapping[reviewItem.resourceId]) {
            reviewResourceMapping[reviewItem.resourceId] = reviewItem
            listOfValidReview.push(reviewItem)
        }
    })

    return {
        ...data,
        review: listOfValidReview,
        reviewResourceMapping,
    }
}
