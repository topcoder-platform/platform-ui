import { every } from 'lodash'

import type {
    BackendPhase,
    Screening,
    SubmissionInfo,
} from '../models'

import { shouldIncludeInReviewPhase } from './reviewPhaseGuards'

const normalizeScreeningResult = (result?: string | null): string => (result ?? '')
    .trim()
    .toUpperCase()

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
    isDesignChallenge: boolean
    reviewRows: SubmissionInfo[]
    screeningRows: Screening[]
}

/**
 * Calculates review phase completion progress as a percentage.
 * Screening-failed submissions are excluded whenever screening outcomes are available.
 *
 * @param args - Inputs needed to evaluate review progress.
 * @returns Rounded completion percentage in the inclusive range [0, 100].
 */
export const calculateReviewProgress = ({
    challengePhases,
    isDesignChallenge,
    reviewRows,
    screeningRows,
}: CalculateReviewProgressArgs): number => {
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
