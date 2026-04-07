/**
 * Util for resolving submissions and submission IDs for reviews.
 */
import { BackendReview, BackendSubmission, SubmissionInfo } from '../models'

/**
 * Normalizes an identifier-like value into a trimmed string.
 *
 * @param value - Raw identifier value from review or submission payloads.
 * @returns Trimmed string identifier or undefined when the value is empty.
 */
function normalizeIdentifier(value: unknown): string | undefined {
    if (value === undefined || value === null) {
        return undefined
    }

    const normalized = `${value}`.trim()
    return normalized.length ? normalized : undefined
}

/**
 * Collects distinct normalized identifiers from a list of raw values.
 *
 * @param values - Identifier candidates that may be empty or duplicated.
 * @returns Unique set of normalized identifiers for downstream matching.
 */
function collectIdentifiers(values: unknown[]): Set<string> {
    const identifiers = new Set<string>()

    values.forEach(value => {
        const normalized = normalizeIdentifier(value)
        if (normalized) {
            identifiers.add(normalized)
        }
    })

    return identifiers
}

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
    const candidateIds = [
        review.submissionId,
        review.legacySubmissionId,
    ]
        .map(normalizeIdentifier)
        .filter((candidate): candidate is string => Boolean(candidate))

    for (const candidateId of candidateIds) {
        const submissionById = submissionsById.get(candidateId)
        if (submissionById) {
            return submissionById
        }

        const submissionByLegacyId = submissionsByLegacyId.get(candidateId)
        if (submissionByLegacyId) {
            return submissionByLegacyId
        }
    }

    return undefined
}

export interface ReviewSubmissionMatchArgs {
    review: Pick<BackendReview, 'legacySubmissionId' | 'submissionId'>
    submission: Pick<BackendSubmission, 'id' | 'legacySubmissionId'>
}

/**
 * Determines whether a review references the supplied submission using either
 * modern or legacy identifiers.
 *
 * @param args - Review and submission identifier fields to compare.
 * @returns True when any normalized review identifier matches a submission identifier.
 */
export function reviewMatchesSubmission({
    review,
    submission,
}: ReviewSubmissionMatchArgs): boolean {
    const reviewIdentifiers = collectIdentifiers([
        review.submissionId,
        review.legacySubmissionId,
    ])

    if (!reviewIdentifiers.size) {
        return false
    }

    const submissionIdentifiers = collectIdentifiers([
        submission.id,
        submission.legacySubmissionId,
    ])

    if (!submissionIdentifiers.size) {
        return false
    }

    return Array.from(reviewIdentifiers)
        .some(identifier => submissionIdentifiers.has(identifier))
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
