import type {
    ChallengePhase,
    ChallengeReviewer,
} from '../models'

/**
 * Normalizes a reviewer or phase value for exact identifier and name comparisons.
 *
 * @param value reviewer or phase value to normalize.
 * @returns trimmed text for string values, otherwise an empty string.
 * @remarks Used internally while resolving whether a reviewer belongs to a screening phase.
 * @throws Does not throw.
 */
function normalizeReviewerValue(value: unknown): string {
    return typeof value === 'string'
        ? value.trim()
        : ''
}

/**
 * Returns whether a reviewer member assignment may be deferred until after launch.
 *
 * @param reviewer reviewer configuration whose phase should be inspected.
 * @param phases challenge phases used to resolve the reviewer's phase name.
 * @returns `true` for a human reviewer configured on Screening or Checkpoint Screening.
 * @remarks Form validation and reviewer fields use this exception; every other reviewer phase
 * still requires assignments up front.
 * @throws Does not throw.
 */
export function isScreenerAssignmentOptional(
    reviewer: ChallengeReviewer | undefined,
    phases: ChallengePhase[] | undefined,
): boolean {
    if (reviewer?.isMemberReview === false || !Array.isArray(phases)) {
        return false
    }

    const reviewerPhaseId = normalizeReviewerValue(reviewer?.phaseId)
    if (!reviewerPhaseId) {
        return false
    }

    return phases.some(phase => {
        const phaseInstanceId = normalizeReviewerValue(phase.id)
        const phaseTemplateId = normalizeReviewerValue(phase.phaseId)
        const matchesPhase = reviewerPhaseId === phaseTemplateId
            || reviewerPhaseId === phaseInstanceId

        const normalizedPhaseName = normalizeReviewerValue(phase.name)
            .toLowerCase()

        return matchesPhase
            && (
                normalizedPhaseName === 'screening'
                || normalizedPhaseName === 'checkpoint screening'
            )
    })
}
