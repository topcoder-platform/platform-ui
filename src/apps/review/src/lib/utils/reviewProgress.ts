import { every } from 'lodash'

import type {
    BackendPhase,
    Screening,
    SubmissionInfo,
} from '../models'

import { shouldIncludeInReviewPhase } from './reviewPhaseGuards'

const COMPLETED_REVIEW_STATUSES = new Set(['COMPLETED', 'SUBMITTED'])

const REVIEW_PROGRESS_PHASES = new Set([
    'checkpointreview',
    'checkpointscreening',
    'review',
    'screening',
])

const normalizeScreeningResult = (result?: string | null): string => (result ?? '')
    .trim()
    .toUpperCase()

/**
 * Normalizes a phase name for phase-aware progress comparisons.
 *
 * @param phaseName - Human-readable challenge phase name.
 * @returns Lower-case alphabetic phase key, or an empty string when absent.
 * Used internally by review progress phase selection. This function does not throw.
 */
const normalizeProgressPhaseName = (phaseName?: string | null): string => (phaseName ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, '')

/**
 * Resolves the review-like phase whose rows should drive the progress bar.
 *
 * @param currentPhaseName - Current phase reported by the challenge response.
 * @param challengePhases - Challenge phase metadata used when the current phase is absent.
 * @returns Normalized supported phase name, or `undefined` when no review-like phase is active.
 * Used by `calculateReviewProgress` and does not throw.
 */
const resolveReviewProgressPhase = (
    currentPhaseName: string | undefined,
    challengePhases?: BackendPhase[],
): string | undefined => {
    const normalizedCurrentPhase = normalizeProgressPhaseName(currentPhaseName)
    if (REVIEW_PROGRESS_PHASES.has(normalizedCurrentPhase)) {
        return normalizedCurrentPhase
    }

    const openReviewPhase = (challengePhases ?? []).find(phase => (
        phase.isOpen
        && REVIEW_PROGRESS_PHASES.has(normalizeProgressPhaseName(phase.name))
    ))

    return openReviewPhase
        ? normalizeProgressPhaseName(openReviewPhase.name)
        : undefined
}

/**
 * Calculates completion across screening-style phase rows.
 *
 * @param rows - Screening, Checkpoint Screening, or Checkpoint Review rows.
 * @returns Rounded completion percentage in the inclusive range [0, 100].
 * Multi-screener rows count each assignment. Rows without assignments remain pending.
 * Used by `calculateReviewProgress` and does not throw.
 */
const calculateScreeningRowsProgress = (rows: Screening[]): number => {
    let completedReviewCount = 0
    let totalReviewCount = 0

    rows.forEach(row => {
        const reviewStatuses = row.screeningReviews?.length
            ? row.screeningReviews.map(review => review.reviewStatus)
            : [row.reviewStatus ?? row.myReviewStatus]

        totalReviewCount += reviewStatuses.length
        completedReviewCount += reviewStatuses.filter(status => (
            COMPLETED_REVIEW_STATUSES.has((status ?? '').trim()
                .toUpperCase())
        )).length
    })

    return totalReviewCount
        ? Math.round((completedReviewCount * 100) / totalReviewCount)
        : 0
}

const resolveReviewSubmissionIds = (submission: SubmissionInfo): string[] => {
    const candidateIds = new Set<string>()
    const submissionId = submission.id?.trim()
    if (submissionId) {
        candidateIds.add(submissionId)
    }

    const reviewSubmissionId = submission.review?.submissionId?.trim()
    if (reviewSubmissionId) {
        candidateIds.add(reviewSubmissionId)
    }

    return Array.from(candidateIds)
}

const isSubmissionIncludedByScreening = (
    submission: SubmissionInfo,
    passingSubmissionIds: Set<string>,
    failingSubmissionIds: Set<string>,
    shouldFilter: boolean,
): boolean => {
    if (!shouldFilter) {
        return true
    }

    const candidateIds = resolveReviewSubmissionIds(submission)
    if (!candidateIds.length) {
        return true
    }

    if (passingSubmissionIds.size > 0) {
        return candidateIds.some(candidateId => passingSubmissionIds.has(candidateId))
    }

    if (failingSubmissionIds.size > 0) {
        return !candidateIds.some(candidateId => failingSubmissionIds.has(candidateId))
    }

    return true
}

const isCompletedReviewSubmission = (submission: SubmissionInfo): boolean => {
    const committed = submission.review?.committed
    if (typeof committed === 'boolean') {
        return committed
    }

    const status = submission.review?.status
    if (typeof status === 'string' && status.trim()) {
        return status.trim()
            .toUpperCase() === 'COMPLETED'
    }

    if (!submission.reviews?.length) {
        return false
    }

    return every(
        submission.reviews,
        reviewResult => typeof reviewResult.score === 'number'
            && Number.isFinite(reviewResult.score),
    )
}

type CalculateReviewProgressArgs = {
    challengePhases?: BackendPhase[]
    checkpointReviewRows: Screening[]
    checkpointScreeningRows: Screening[]
    currentPhaseName: string | undefined
    isDesignChallenge: boolean
    reviewRows: SubmissionInfo[]
    screeningRows: Screening[]
}

/**
 * Calculates completion progress for the current review-like challenge phase.
 * Final Review preserves screening outcome and submission-history filtering, while
 * Screening and checkpoint phases use their phase-specific assignment rows.
 *
 * @param args - Inputs needed to evaluate review progress.
 * @returns Rounded completion percentage in the inclusive range [0, 100].
 * Used by `useFetchScreeningReview` for the challenge header. This function does not throw.
 */
export const calculateReviewProgress = ({
    challengePhases,
    checkpointReviewRows,
    checkpointScreeningRows,
    currentPhaseName,
    isDesignChallenge,
    reviewRows,
    screeningRows,
}: CalculateReviewProgressArgs): number => {
    const progressPhase = resolveReviewProgressPhase(currentPhaseName, challengePhases)

    if (progressPhase === 'checkpointreview') {
        return calculateScreeningRowsProgress(checkpointReviewRows)
    }

    if (progressPhase === 'checkpointscreening') {
        return calculateScreeningRowsProgress(checkpointScreeningRows)
    }

    if (progressPhase === 'screening') {
        return calculateScreeningRowsProgress(screeningRows)
    }

    if (!reviewRows.length) {
        return 0
    }

    const reviewPhaseRows = reviewRows.filter(submission => shouldIncludeInReviewPhase(
        submission,
        challengePhases,
    ))
    if (!reviewPhaseRows.length) {
        return 0
    }

    const passingSubmissionIds = new Set<string>()
    const failingSubmissionIds = new Set<string>()

    screeningRows.forEach(screeningEntry => {
        const submissionId = screeningEntry?.submissionId?.trim()
        if (!submissionId) {
            return
        }

        const normalizedResult = normalizeScreeningResult(screeningEntry.result)
        if (normalizedResult === 'PASS') {
            passingSubmissionIds.add(submissionId)
            return
        }

        if (normalizedResult === 'NO PASS') {
            failingSubmissionIds.add(submissionId)
        }
    })

    const hasScreeningPhase = (challengePhases ?? []).some(
        phase => (phase.name ?? '').trim()
            .toLowerCase() === 'screening',
    )
    const shouldFilterByScreening = (
        (hasScreeningPhase || screeningRows.length > 0)
        && (passingSubmissionIds.size > 0 || failingSubmissionIds.size > 0)
    )

    const filteredByScreening = reviewPhaseRows.filter(submission => isSubmissionIncludedByScreening(
        submission,
        passingSubmissionIds,
        failingSubmissionIds,
        shouldFilterByScreening,
    ))
    if (!filteredByScreening.length) {
        return 0
    }

    const progressRows = isDesignChallenge
        ? filteredByScreening
        : filteredByScreening.filter(submission => submission.isLatest)
    if (!progressRows.length) {
        return 0
    }

    const completedReviews = progressRows.filter(isCompletedReviewSubmission)
    return Math.round((completedReviews.length * 100) / progressRows.length)
}
