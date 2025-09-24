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
    score: string
    result: ScreeningResult
    memberId: string
    userInfo?: BackendResource // this field is calculated at frontend
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
    // update screening result base on the submission status
    if (data.status.toString() === 'FAILED_SCREENING') {
        result = 'NO PASS'
    } else if (!!data.screeningScore) {
        result = 'PASS'
    }

    return {
        challengeId: data.challengeId,
        createdAt,
        createdAtString,
        memberId: data.memberId,
        result,
        score: data.screeningScore ?? 'Pending',
        screenerId: '',
        submissionId: data.id,
    }
}
