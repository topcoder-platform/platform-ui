/**
 * Model for backend project result
 */
export interface BackendProjectResult {
    challengeId: string
    userId: string
    paymentId: null | string
    submissionId: string
    oldRating?: number
    newRating: number
    initialScore: number
    finalScore: number
    placement: number
    rated: boolean
    passedReview: boolean
    validSubmission: boolean
    pointAdjustment: null | number
    ratingOrder: number
    createdAt: string
    createdBy: string
    updatedAt: string
    updatedBy: string
}
