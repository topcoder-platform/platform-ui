import type { BackendResource } from '../models/BackendResource.model'
import type { BackendReview } from '../models/BackendReview.model'
import type { BackendSubmission } from '../models/BackendSubmission.model'
import type { SubmissionInfo } from '../models/SubmissionInfo.model'
import { convertBackendReviewToReviewInfo } from '../models/ReviewInfo.model'
import { convertBackendReviewToReviewResult } from '../models/ReviewResult.model'
import { convertBackendSubmissionToSubmissionInfo } from '../models/SubmissionInfo.model'

import type { SubmissionLookupArgs } from './submissionResolution'
import { resolveSubmissionForReview } from './submissionResolution'
import { collectMatchingReviews } from './reviewSelection'
import { reviewMatchesPhase } from './reviewMatching'

export interface BuildApprovalReviewRowsArgs {
    approvalPhaseIds: Set<string>
    approvalScorecardId?: string
    challengeReviews?: BackendReview[]
    contestSubmissions: BackendSubmission[]
    resourceMemberIdMapping: Record<string, BackendResource | undefined>
    submissionsById: Map<string, BackendSubmission>
    submissionsByLegacyId: Map<string, BackendSubmission>
}

const buildSubmissionInfoWithReview = (
    submission: BackendSubmission,
    review: BackendReview,
    resourceMemberIdMapping: Record<string, BackendResource | undefined>,
): SubmissionInfo => {
    const submissionWithReview: BackendSubmission = {
        ...submission,
        review: [review],
    }
    const submissionInfo = convertBackendSubmissionToSubmissionInfo(submissionWithReview)

    return {
        ...submissionInfo,
        review: submissionInfo.review ?? convertBackendReviewToReviewInfo(review),
        reviews: [convertBackendReviewToReviewResult(review)],
        userInfo: resourceMemberIdMapping[submissionInfo.memberId],
    }
}

/**
 * Builds Approval tab rows from both challenge-level review queries and submission-local review
 * data so live continuation approvals still render even when the challenge review list has not
 * caught up yet.
 *
 * @param args - Approval phase metadata, submissions, reviews, and resource mapping context.
 * @returns One row per unique approval review instance.
 */
export function buildApprovalReviewRows({
    approvalPhaseIds,
    approvalScorecardId,
    challengeReviews,
    contestSubmissions,
    resourceMemberIdMapping,
    submissionsById,
    submissionsByLegacyId,
}: BuildApprovalReviewRowsArgs): SubmissionInfo[] {
    if (approvalPhaseIds.size === 0) {
        return []
    }

    const rowsByReviewId = new Map<string, SubmissionInfo>()
    const addRow = (
        review: BackendReview | undefined,
        submission: BackendSubmission | undefined,
    ): void => {
        if (!review?.id || !submission) {
            return
        }

        if (!reviewMatchesPhase(review, approvalScorecardId, approvalPhaseIds, 'Approval')) {
            return
        }

        if (!rowsByReviewId.has(review.id)) {
            rowsByReviewId.set(
                review.id,
                buildSubmissionInfoWithReview(submission, review, resourceMemberIdMapping),
            )
        }
    }

    challengeReviews?.forEach(review => {
        const submission = resolveSubmissionForReview({
            review,
            submissionsById,
            submissionsByLegacyId,
        } satisfies SubmissionLookupArgs)

        addRow(review, submission)
    })

    contestSubmissions.forEach(submission => {
        const submissionReviews = collectMatchingReviews(
            submission,
            'Approval',
            approvalScorecardId,
            approvalPhaseIds,
            undefined,
            challengeReviews,
        )

        submissionReviews.forEach(review => addRow(review, submission))
    })

    return Array.from(rowsByReviewId.values())
}
