import _ from 'lodash'
import moment from 'moment'

import { TABLE_DATE_FORMAT } from '../../config/index.config'
import { formatDurationDate } from '../utils'

import { SubmissionInfo } from './SubmissionInfo.model'
import { BackendPhase } from './BackendPhase.model'

// Challenge type/track are now objects
export interface ChallengeType {
    id: string
    name: string
    abbreviation?: string
}

export interface ChallengeTrack {
    id: string
    name: string
    abbreviation?: string
    track?: string
}

/**
 * Winner info for a challenge
 */
export interface ChallengeWinner {
    userId: number
    handle: string
    placement: number
    type?: string
    maxRating?: number | null
}

/**
 * Challenge info
 */
export interface ChallengeInfo {
    id: string
    name: string
    currentPhase: string
    currentPhaseEndDate: string | Date
    currentPhaseEndDateString?: string // this field is calculated at frontend
    endDate?: string | Date
    endDateString?: string
    timeLeft?: string // this field is calculated at frontend
    timeLeftColor?: string // this field is calculated at frontend
    timeLeftStatus?: string // this field is calculated at frontend
    reviewProgress?: number // this field is calculated at frontend
    index?: number // this field is calculated at frontend
    submissions: SubmissionInfo[]
    type: ChallengeType
    typeId: string
    track: ChallengeTrack
    reviewLength?: number
    discussionsUrl?: string // this field is calculated at frontend
    legacyId?: number
    status?: string
    phases: BackendPhase[]
    winners?: ChallengeWinner[]
    // Optional: prize sets from backend (placement, copilot, etc.)
    // Present on the backend response and spread into the converted model.
    // We include it here so components can read prize configuration safely.
    prizeSets?: import('./BackendPrizeSet.model').BackendPrizeSet[]
    reviewers?: {
        scorecardId: string
        isMemberReview: boolean
        memberReviewerCount: number
        phaseId: string
        basePayment: number
        incrementalPayment: number
        type: string
        isAIReviewer: boolean
    }[]
    currentPhaseObject?: BackendPhase
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
        timeLeftStatus: timeLeft.durationStatus,
    }
}
