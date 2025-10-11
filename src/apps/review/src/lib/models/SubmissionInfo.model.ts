import moment from 'moment'

import { TABLE_DATE_FORMAT } from '../../config/index.config'

import { BackendResource } from './BackendResource.model'
import { BackendSubmission } from './BackendSubmission.model'
import {
    adjustReviewInfo,
    convertBackendReviewToReviewInfo,
    ReviewInfo,
} from './ReviewInfo.model'
import {
    convertBackendReviewToReviewResult,
    ReviewResult,
} from './ReviewResult.model'

/**
 * Challenge submission info
 */
export interface SubmissionInfo {
    id: string
    memberId: string
    userInfo?: BackendResource // this field is calculated at frontend
    review?: ReviewInfo
    reviews?: ReviewResult[]
    /**
     * Aggregated final score from review summations when available.
     */
    aggregateScore?: number
    /**
     * The date/time when the submission was created.
     */
    submittedDate?: string | Date
    /**
     * Localized string for the submitted date, computed on frontend.
     */
    submittedDateString?: string
    /**
     * Virus scan status (true when scan passed, false when failed).
     */
    virusScan?: boolean
    /**
     * Indicates whether this submission is the latest for the member.
     */
    isLatest?: boolean
}

/**
 * Update review info to show in ui
 * @param data data from backend response
 * @returns updated data
 */
export function adjustSubmissionInfo(
    data: SubmissionInfo | undefined,
): SubmissionInfo | undefined {
    if (!data) {
        return data
    }

    return {
        ...data,
        review: data.review ? adjustReviewInfo(data.review) : undefined,
    }
}

/**
 * Convert backend submission info to show in review table
 *
 * @param data data from backend response
 * @returns updated data
 */
export function convertBackendSubmissionToSubmissionInfo(
    data: BackendSubmission,
): SubmissionInfo {
    const submittedDate = data.submittedDate ? new Date(data.submittedDate) : undefined
    const submittedDateString = submittedDate
        ? moment(submittedDate)
            .local()
            .format(TABLE_DATE_FORMAT)
        : undefined
    const aggregateScoreRaw = data.reviewSummation?.[0]?.aggregateScore
    const aggregateScoreParsed = typeof aggregateScoreRaw === 'number'
        ? aggregateScoreRaw
        : typeof aggregateScoreRaw === 'string'
            ? Number.parseFloat(aggregateScoreRaw)
            : undefined
    const aggregateScore = typeof aggregateScoreParsed === 'number'
        && Number.isFinite(aggregateScoreParsed)
        ? aggregateScoreParsed
        : undefined

    return {
        aggregateScore,
        id: data.id,
        isLatest: data.isLatest ?? false,
        memberId: data.memberId,
        review:
            data.review && data.review[0]
                ? convertBackendReviewToReviewInfo(data.review[0])
                : undefined,
        reviews: data.review.map(convertBackendReviewToReviewResult),
        submittedDate,
        submittedDateString,
        virusScan: data.virusScan,
    }
}
