import moment from 'moment'

import { TABLE_DATE_FORMAT } from '../../config/index.config'

import { BackendSubmission } from './BackendSubmission.model'
import { BackendResource } from './BackendResource.model'

type ScreeningResult = 'PASS' | 'NO PASS' | '' | '-'

export interface Screening {
    challengeId: string
    submissionId: string
    createdAt: string | Date
    createdAtString?: string // this field is calculated at frontend
    screenerId?: string
    screener?: BackendResource // this field is calculated at frontend
    checkpointReviewer?: BackendResource // optional dedicated checkpoint reviewer handle
    score: string
    result: ScreeningResult
    memberId: string
    userInfo?: BackendResource // this field is calculated at frontend
    /**
     * Virus scan status (true when scan passed, false when failed).
     */
    virusScan?: boolean
    /**
     * For the current viewer: resourceId of their review assignment (if any)
     * used to deep-link to scorecard details.
     */
    myReviewResourceId?: string
    /**
     * For the current viewer: reviewId of their assignment (if any).
     */
    myReviewId?: string
    /**
     * For the current viewer: status of their review assignment (if any)
     * e.g., PENDING | IN_PROGRESS | SUBMITTED | COMPLETED
     */
    myReviewStatus?: string
    /**
     * Overall review status for the associated scorecard.
     */
    reviewStatus?: string
    /**
     * Indicates whether this submission is the latest for the member.
     */
    isLatest?: boolean
    /**
     * The review id associated with this screening entry (if available).
     */
    reviewId?: string
    /**
     * The phase identifier associated with the linked review (if available).
     */
    reviewPhaseId?: string
    /**
     * Submission type (e.g. CONTEST_SUBMISSION, CHECKPOINT_SUBMISSION).
     */
    type?: string
    /**
     * The phase name of the associated review (e.g., 'Screening', 'Review').
     * Used for defensive filtering to ensure phase data isolation.
     */
    phaseName?: string
}

/**
 * Convert backend submission info to show in screening table
 *
 * @param data data from backend response
 * @returns updated data
 */
export function convertBackendSubmissionToScreening(
    data: BackendSubmission,
): Screening {
    const createdAt = new Date(data.createdAt)
    const createdAtString = createdAt
        ? moment(createdAt)
            .local()
            .format(TABLE_DATE_FORMAT)
        : undefined

    let result: ScreeningResult = '-'
    const status = (data.status ?? '')
        .toString()
        .toUpperCase()

    // update screening result base on the submission status
    if (status === 'FAILED_SCREENING' || status === 'FAILED_CHECKPOINT_SCREENING') {
        result = 'NO PASS'
    } else if (!!data.screeningScore) {
        result = 'PASS'
    }

    return {
        challengeId: data.challengeId,
        createdAt,
        createdAtString,
        isLatest: data.isLatest,
        memberId: data.memberId,
        result,
        score: data.screeningScore ?? 'Pending',
        screenerId: '',
        submissionId: data.id,
        type: data.type,
        virusScan: data.virusScan,
    }
}
