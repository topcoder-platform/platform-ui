import { BackendReview } from './BackendReview.model'
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
}
