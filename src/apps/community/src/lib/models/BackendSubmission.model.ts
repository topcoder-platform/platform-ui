/**
 * Raw submission response from submissions-api-v6.
 */
export interface BackendSubmission {
    challengeId: string
    created?: string
    createdAt?: string
    id: string
    legacySubmissionId?: string
    memberHandle?: string
    memberId: string
    review?: Record<string, unknown> | Array<Record<string, unknown>>
    status: string
    submittedDate?: string
    submitterHandle?: string
    type: string
    updated?: string
    updatedAt?: string
    url?: string | null
}
