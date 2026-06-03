import type { BackendSubmission } from './BackendSubmission.model'

/**
 * Submission data used by the community app.
 */
export interface SubmissionInfo {
    challengeId: string
    created: string
    id: string
    legacySubmissionId?: string
    memberHandle?: string
    memberId: string
    review?: Record<string, unknown> | Array<Record<string, unknown>>
    status: string
    type: string
    updated: string
    url: string
}

/**
 * Converts raw backend submission data into the frontend submission model.
 *
 * @param data Raw backend submission.
 * @returns Converted submission model.
 */
export function convertBackendSubmission(data: BackendSubmission): SubmissionInfo {
    return {
        ...data,
        created: data.created ?? data.submittedDate ?? data.createdAt ?? '',
        memberHandle: data.memberHandle ?? data.submitterHandle,
        updated: data.updated ?? data.updatedAt ?? '',
        url: data.url ?? '',
    }
}
