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
    createdBy: string
    updatedAt: string
    updatedBy: string
}
