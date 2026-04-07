import type { ChallengeWinner, SubmissionInfo } from '../models'

const toFiniteNumber = (value?: number | null): number | undefined => (
    typeof value === 'number' && Number.isFinite(value) ? value : undefined
)

const normalizeIdentifier = (value?: string | number | null): string | undefined => {
    if (value === undefined || value === null) {
        return undefined
    }

    const normalized = `${value}`.trim()
    return normalized.length ? normalized : undefined
}

const normalizeHandle = (value?: string | null): string | undefined => {
    const normalized = value?.trim()
        .toLowerCase()
    return normalized?.length ? normalized : undefined
}

/**
 * Determine whether a submission belongs to a winner using progressively looser
 * legacy-safe matching. Old challenges can disagree on the member id, but
 * placement or submitter handle still identify the winning submission reliably.
 *
 * @param submission - Submission candidate to evaluate.
 * @param winner - Winner row from challenge info.
 * @returns True when the submission can be treated as the winner's submission.
 */
export const submissionMatchesWinner = (
    submission: SubmissionInfo,
    winner: ChallengeWinner,
): boolean => {
    const winnerUserId = normalizeIdentifier(winner.userId)
    const submissionMemberId = normalizeIdentifier(submission.memberId)

    if (winnerUserId && submissionMemberId && winnerUserId === submissionMemberId) {
        return true
    }

    const winnerHandle = normalizeHandle(winner.handle)
    const submissionHandles = [
        submission.submitterHandle,
        submission.review?.submitterHandle,
        submission.userInfo?.memberHandle,
    ]
        .map(normalizeHandle)
        .filter((handle): handle is string => Boolean(handle))

    if (winnerHandle && submissionHandles.some(handle => handle === winnerHandle)) {
        return true
    }

    const submissionPlacement = toFiniteNumber(submission.placement ?? undefined)
    return Boolean(
        typeof winner.placement === 'number'
        && Number.isFinite(winner.placement)
        && submissionPlacement === winner.placement,
    )
}
