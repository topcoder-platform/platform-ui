/**
 * Util for resolving submissions and submission IDs for reviews.
 */
import { BackendReview, BackendSubmission, SubmissionInfo } from '../models'

export interface SubmissionLookupArgs {
    review: BackendReview
    submissionsById: Map<string, BackendSubmission>
    submissionsByLegacyId: Map<string, BackendSubmission>
}

/**
 * Resolves the submission associated with the provided review.
 *
 * @param args - Lookup arguments including the review and submission maps.
 * @returns The matching submission or undefined when no submission is found.
 */
export function resolveSubmissionForReview({
    review,
    submissionsById,
    submissionsByLegacyId,
}: SubmissionLookupArgs): BackendSubmission | undefined {
    if (review.submissionId) {
        const submissionById = submissionsById.get(review.submissionId)
        if (submissionById) {
            return submissionById
        }
    }

    if (review.legacySubmissionId) {
        const legacyKey = `${review.legacySubmissionId}`
        const submissionByLegacyId = submissionsByLegacyId.get(legacyKey)
        if (submissionByLegacyId) {
            return submissionByLegacyId
        }
    }

    return undefined
}

export interface SubmissionIdResolutionArgs {
    baseSubmissionInfo?: SubmissionInfo
    defaultId: string
    matchingSubmission?: BackendSubmission
    review: BackendReview
}

/**
 * Resolves a usable submission identifier using a stable precedence order.
 *
 * @param args - Resolution arguments with review context and fallback information.
 * @returns The first available submission identifier or undefined if none are present.
 */
export function resolveFallbackSubmissionId({
    baseSubmissionInfo,
    defaultId,
    matchingSubmission,
    review,
}: SubmissionIdResolutionArgs): string | undefined {
    return review.submissionId
        ?? baseSubmissionInfo?.id
        ?? (review.legacySubmissionId ? `${review.legacySubmissionId}` : undefined)
        ?? review.id
        ?? matchingSubmission?.id
        ?? defaultId
}

export interface SubmitterMemberIdResolutionArgs {
    baseSubmissionInfo?: SubmissionInfo
    matchingSubmission?: BackendSubmission
}

/**
 * Resolves the submitter member identifier from submission data.
 *
 * @param args - Resolution inputs that can include submission info and direct matches.
 * @returns The resolved member identifier or an empty string when unavailable.
 */
export function resolveSubmitterMemberId({
    baseSubmissionInfo,
    matchingSubmission,
}: SubmitterMemberIdResolutionArgs): string {
    return matchingSubmission?.memberId ?? baseSubmissionInfo?.memberId ?? ''
}
