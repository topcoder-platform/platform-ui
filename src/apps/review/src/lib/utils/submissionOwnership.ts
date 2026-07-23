import type { SubmissionInfo } from '../models'

/**
 * Filters submission rows to those owned by the current challenge member.
 *
 * A populated member ID is authoritative, while submission IDs provide a
 * fallback for legacy review rows that omit member ownership.
 *
 * @param submissions - Submission or review rows to scope for a submitter.
 * @param ownedMemberIds - Challenge member IDs associated with the current user.
 * @param ownedSubmissionIds - Submission IDs known to belong to the current user.
 * @returns Rows owned by the current user, preserving their original order and type.
 * @throws This helper does not throw.
 * Used by submitter Appeals views before rendering review and download actions.
 */
export function filterSubmissionRowsByOwnership<T extends SubmissionInfo>(
    submissions: readonly T[],
    ownedMemberIds: ReadonlySet<string>,
    ownedSubmissionIds: ReadonlySet<string> = new Set<string>(),
): T[] {
    const normalizedMemberIds = new Set<string>(
        Array.from(ownedMemberIds)
            .map(memberId => `${memberId}`.trim())
            .filter(Boolean),
    )
    const normalizedSubmissionIds = new Set<string>(
        Array.from(ownedSubmissionIds)
            .map(submissionId => `${submissionId}`.trim())
            .filter(Boolean),
    )

    return submissions.filter(submission => {
        const memberId = `${submission.memberId ?? ''}`.trim()
        if (memberId.length) {
            return normalizedMemberIds.has(memberId)
        }

        const submissionIds = [
            submission.id,
            submission.legacySubmissionId,
            submission.review?.submissionId,
        ]

        return submissionIds.some(submissionId => {
            const normalizedSubmissionId = `${submissionId ?? ''}`.trim()
            return normalizedSubmissionId.length > 0
                && normalizedSubmissionIds.has(normalizedSubmissionId)
        })
    })
}
