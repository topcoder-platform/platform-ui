/**
 * Active review assignment item prepared for UI consumption.
 */
export interface ActiveReviewAssignment {
    id: string
    name: string
    currentPhase: string
    currentPhaseEndDate?: string | Date | null
    currentPhaseEndDateString?: string
    timeLeft?: string
    timeLeftColor?: string
    timeLeftStatus?: string
    reviewProgress?: number
    index: number
    resourceRoles: string[]
    challengeTypeId: string
    challengeTypeName: string
}
