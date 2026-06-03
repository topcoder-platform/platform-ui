import type { BackendResource } from '../models/BackendResource.model'
import type { BackendReview } from '../models/BackendReview.model'
import type { BackendSubmission } from '../models/BackendSubmission.model'
import {
    convertBackendReviewToReviewInfo,
} from '../models/ReviewInfo.model'
import {
    convertBackendReviewToReviewResult,
} from '../models/ReviewResult.model'
import {
    convertBackendSubmissionToSubmissionInfo,
    type SubmissionInfo,
} from '../models/SubmissionInfo.model'
import {
    isContestSubmissionType,
    isFinalFixSubmissionType,
} from '../constants'

import {
    resolveFallbackSubmissionId,
    resolveSubmitterMemberId,
    type SubmissionIdResolutionArgs,
    type SubmitterMemberIdResolutionArgs,
} from './submissionResolution'

export interface BuildSubmitterReviewSubmissionArgs {
    defaultId: string
    matchingSubmission?: BackendSubmission
    resourceMemberIdMapping: Record<string, BackendResource | undefined>
    review: BackendReview
}

/**
 * Builds a submitter-facing review row from a resolved contest or final-fix submission
 * when present, while allowing legacy review-only fallbacks when older challenges cannot
 * be mapped back to a modern submission record.
 *
 * @param args - Review row inputs including the matched submission when available.
 * @returns Submitter-facing review row or undefined when the matched submission type is unsupported.
 */
export function buildSubmitterReviewSubmission({
    defaultId,
    matchingSubmission,
    resourceMemberIdMapping,
    review,
}: BuildSubmitterReviewSubmissionArgs): SubmissionInfo | undefined {
    const isSupportedSubmissionType = isContestSubmissionType(matchingSubmission?.type)
        || isFinalFixSubmissionType(matchingSubmission?.type)

    if (matchingSubmission && !isSupportedSubmissionType) {
        return undefined
    }

    const submissionWithReview: BackendSubmission | undefined = matchingSubmission
        ? {
            ...matchingSubmission,
            review: [review],
        }
        : undefined

    const baseSubmissionInfo = submissionWithReview
        ? convertBackendSubmissionToSubmissionInfo(submissionWithReview)
        : undefined

    const fallbackId = resolveFallbackSubmissionId({
        baseSubmissionInfo,
        defaultId,
        matchingSubmission,
        review,
    } satisfies SubmissionIdResolutionArgs)

    if (!fallbackId) {
        return undefined
    }

    const resolvedMemberId = resolveSubmitterMemberId({
        baseSubmissionInfo,
        matchingSubmission,
    } satisfies SubmitterMemberIdResolutionArgs)

    const reviewInfo = convertBackendReviewToReviewInfo(review)
    const reviewResult = convertBackendReviewToReviewResult(review)

    return {
        ...baseSubmissionInfo,
        id: fallbackId,
        isLatest: baseSubmissionInfo?.isLatest
            ?? matchingSubmission?.isLatest
            ?? true,
        memberId: resolvedMemberId,
        review: reviewInfo,
        reviews: [reviewResult],
        reviewTypeId: review.typeId ?? baseSubmissionInfo?.reviewTypeId,
        submittedDate: baseSubmissionInfo?.submittedDate,
        submittedDateString: baseSubmissionInfo?.submittedDateString,
        userInfo: resolvedMemberId
            ? resourceMemberIdMapping[resolvedMemberId]
            : undefined,
        virusScan: baseSubmissionInfo?.virusScan,
    } as SubmissionInfo
}
