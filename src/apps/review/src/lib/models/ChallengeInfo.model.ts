import _ from 'lodash'
import moment from 'moment'

import { TABLE_DATE_FORMAT } from '../../config/index.config'
import { formatDurationDate } from '../utils'

import { SubmissionInfo } from './SubmissionInfo.model'

/**
 * Challenge info
 */
export interface ChallengeInfo {
    id: string
    name: string
    currentPhase: string
    currentPhaseEndDate: string | Date
    currentPhaseEndDateString?: string // this field is calculated at frontend
    timeLeft?: string // this field is calculated at frontend
    timeLeftColor?: string // this field is calculated at frontend
    reviewProgress?: number // this field is calculated at frontend
    index?: number // this field is calculated at frontend
    submissions: SubmissionInfo[]
}

/**
 * Update challenge info to show in ui
 * @param data data from backend response
 * @param index index of data
 * @returns updated data
 */
export function adjustChallengeInfo(
    data: ChallengeInfo | undefined,
    index?: number,
): ChallengeInfo | undefined {
    if (!data) {
        return data
    }

    const currentPhaseEndDate = data.currentPhaseEndDate
        ? new Date(data.currentPhaseEndDate)
        : data.currentPhaseEndDate
    const timeLeft = formatDurationDate(currentPhaseEndDate as Date, new Date())
    const submittedReviewSubmissions = _.filter(
        data.submissions,
        item => !!item.review?.finalScore,
    )

    return {
        ...data,
        currentPhaseEndDate,
        currentPhaseEndDateString: data.currentPhaseEndDate
            ? moment(data.currentPhaseEndDate)
                .local()
                .format(TABLE_DATE_FORMAT)
            : data.currentPhaseEndDate,
        index,
        // the % = (The number of submission has been reviewed / submitted review) / The total number of submissions.
        reviewProgress:
            data.submissions.length > 0
                ? Math.round(
                    (submittedReviewSubmissions.length * 100)
                    / data.submissions.length,
                )
                : 0,
        timeLeft: timeLeft.durationString,
        timeLeftColor: timeLeft.durationColor,
    }
}
