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
}
