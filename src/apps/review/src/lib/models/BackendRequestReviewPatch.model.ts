/**
 * Backend request to update review
 */

import { BackendRequestReviewItem } from './BackendRequestReviewItem.model'

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
    metadata?: Record<string, unknown>
    reviewItems?: BackendRequestReviewItem[]
}
