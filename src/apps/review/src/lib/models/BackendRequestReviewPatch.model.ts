/**
 * Backend request to update review
 */

export interface BackendRequestReviewPatch {
    resourceId?: string
    phaseId?: string
    submissionId?: string
    scorecardId?: string
    finalScore?: number
    initialScore?: number
    typeId?: string
    status?: string
    reviewDate?: string
    committed?: boolean
}
