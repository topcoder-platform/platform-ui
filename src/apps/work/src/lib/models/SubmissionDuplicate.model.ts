/**
 * Models for the SHA-256 duplicate submission detection endpoint.
 */

/**
 * A submission sharing the exact SHA-256 digest of the checked submission.
 */
export interface SubmissionDuplicate {
    /** Challenge that owns the duplicate submission. */
    challenge?: string
    /** Challenge name, when the API could resolve it. */
    challengeTitle?: string
    /** True when the duplicate lives on a different challenge. */
    isCrossChallenge: boolean
    /** ID of the duplicate submission. */
    submissionId: string
    /** ISO timestamp the duplicate was submitted. */
    submittedAt?: string
    /** Member ID that created the duplicate submission. */
    user?: string
    /** Member handle resolved from `user`, when available. */
    userHandle?: string
}

/** Duplicate matches keyed by the checked submission ID. */
export type SubmissionDuplicatesMap = Record<string, SubmissionDuplicate[]>
