/**
 * Raw submission response from submissions-api-v6.
 */
export interface BackendSubmission {
    challengeId: string
    created: string
    id: string
    legacySubmissionId?: string
    memberHandle?: string
    memberId: string
    review?: Record<string, unknown>
    status: string
    type: string
    updated: string
    url: string
}
