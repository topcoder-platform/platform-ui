/**
 * Winner info returned with my review assignments.
 */
export interface BackendMyReviewAssignmentWinner {
    userId: number
    handle: string
    placement: number
    type: string
    maxRating: number | null
}

/**
 * Backend response item for my review assignments endpoint.
 */
export interface BackendMyReviewAssignment {
    challengeId: string
    challengeName: string
    challengeTypeId: string
    challengeTypeName: string
    challengeEndDate: string | null
    currentPhaseName: string
    currentPhaseEndDate: string | null
    timeLeftInCurrentPhase: number | null
    resourceRoleName: string
    reviewProgress: number | null
    winners?: BackendMyReviewAssignmentWinner[] | null
}
