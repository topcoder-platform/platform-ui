import { orderBy } from 'lodash'

import type { BackendReview, BackendSubmission } from '../models'

import { reviewMatchesPhase } from './reviewMatching'
import { getNumericScore } from './reviewScoring'

/**
 * Compares two phase labels after normalizing case and whitespace.
 *
 * @param value - Candidate phase label.
 * @param target - Expected phase label.
 * @returns True when both labels resolve to the same normalized value.
 */
const phaseNameEquals = (
    value: string | null | undefined,
    target: string,
): boolean => {
    if (typeof value !== 'string') {
        return false
    }

    const normalizedValue = value.trim()
        .toLowerCase()
    const normalizedTarget = target.trim()
        .toLowerCase()

    return normalizedValue === normalizedTarget
}

/**
 * Determines whether a review belongs to the target phase.
 *
 * @param review - Review to evaluate.
 * @param phaseLabel - Human-readable phase label.
 * @param scorecardId - Resolved scorecard id for the target phase.
 * @param phaseIds - Resolved phase ids that map to the target phase.
 * @returns True when the review can be treated as a candidate for the phase.
 */
const matchesReviewPhaseCandidate = (
    review: BackendReview | undefined,
    phaseLabel: string,
    scorecardId: string | undefined,
    phaseIds: Set<string>,
): boolean => {
    if (!review) {
        return false
    }

    if (reviewMatchesPhase(review, scorecardId, phaseIds, phaseLabel)) {
        return true
    }

    if (phaseNameEquals((review as { phaseName?: string | null }).phaseName, phaseLabel)) {
        return true
    }

    const reviewType = (review as { reviewType?: string | null }).reviewType
    if (phaseNameEquals(reviewType, phaseLabel)) {
        return true
    }

    return false
}

/**
 * Collects distinct reviews for a submission that match the requested phase.
 *
 * @param submission - Submission to gather reviews for.
 * @param phaseLabel - Human-readable phase label.
 * @param scorecardId - Resolved scorecard id for the target phase.
 * @param phaseIds - Resolved phase ids that map to the target phase.
 * @param submissionReviewMap - Optional map keyed by submission id.
 * @param globalReviews - Optional challenge-level review list.
 * @returns Array of unique matching reviews for the submission.
 */
export const collectMatchingReviews = (
    submission: BackendSubmission,
    phaseLabel: string,
    scorecardId: string | undefined,
    phaseIds: Set<string>,
    submissionReviewMap?: Map<string, BackendReview>,
    globalReviews?: BackendReview[],
): BackendReview[] => {
    const seen = new Map<string, BackendReview>()
    const pushReview = (review: BackendReview | undefined): void => {
        if (!review?.id) {
            return
        }

        if (!matchesReviewPhaseCandidate(review, phaseLabel, scorecardId, phaseIds)) {
            return
        }

        if (!seen.has(review.id)) {
            seen.set(review.id, review)
        }
    }

    if (submissionReviewMap?.size) {
        pushReview(submissionReviewMap.get(submission.id))
    }

    if (Array.isArray(globalReviews) && globalReviews.length) {
        globalReviews.forEach(review => {
            if (review?.submissionId === submission.id) {
                pushReview(review)
            }
        })
    }

    if (submission.reviewResourceMapping) {
        Object.values(submission.reviewResourceMapping)
            .forEach(review => {
                pushReview(review)
            })
    }

    if (Array.isArray(submission.review)) {
        submission.review.forEach(review => {
            pushReview(review)
        })
    }

    return Array.from(seen.values())
}

/**
 * Finds a best-effort phase review in submission-local review data.
 *
 * @param submission - Submission to inspect.
 * @param phaseLabel - Human-readable phase label.
 * @param scorecardId - Resolved scorecard id for the target phase.
 * @param phaseIds - Resolved phase ids that map to the target phase.
 * @returns Matching fallback review when one exists.
 */
const findFallbackReview = (
    submission: BackendSubmission,
    phaseLabel: string,
    scorecardId: string | undefined,
    phaseIds: Set<string>,
): BackendReview | undefined => {
    if (!Array.isArray(submission.review)) {
        return undefined
    }

    const phaseLabelLower = phaseLabel.toLowerCase()

    return submission.review.find(review => {
        if (!review) {
            return false
        }

        if (matchesReviewPhaseCandidate(review, phaseLabel, scorecardId, phaseIds)) {
            return true
        }

        const typeMatches = typeof review.typeId === 'string'
            && review.typeId.toLowerCase()
                .includes(phaseLabelLower)

        return typeMatches
    })
}

/**
 * Selects the single best review to represent a submission in table rows.
 *
 * Selection priority favors committed/completed reviews with concrete scores,
 * then the most recently updated candidate.
 *
 * @param reviews - Candidate reviews already matched to the target phase.
 * @param phaseLabel - Human-readable phase label.
 * @param scorecardId - Resolved scorecard id for the target phase.
 * @param phaseIds - Resolved phase ids that map to the target phase.
 * @param submission - Submission context used for fallback lookup.
 * @returns The best review candidate or undefined.
 */
export const selectBestReview = (
    reviews: BackendReview[],
    phaseLabel: string,
    scorecardId: string | undefined,
    phaseIds: Set<string>,
    submission: BackendSubmission,
): BackendReview | undefined => {
    if (!reviews.length) {
        return findFallbackReview(submission, phaseLabel, scorecardId, phaseIds)
    }

    const sorted = orderBy(
        reviews,
        [
            (review: BackendReview) => Boolean(review.committed),
            (review: BackendReview) => (review.status || '').toUpperCase() === 'COMPLETED',
            (review: BackendReview) => {
                const score = getNumericScore(review)
                return typeof score === 'number' ? score : -Infinity
            },
            (review: BackendReview) => {
                const updatedAt = review.updatedAt || review.reviewDate || review.createdAt
                const parsed = updatedAt ? Date.parse(updatedAt) : NaN
                return Number.isFinite(parsed) ? parsed : 0
            },
        ],
        ['desc', 'desc', 'desc', 'desc'],
    )

    return sorted[0]
}
