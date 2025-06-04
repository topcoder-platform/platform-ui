import _ from 'lodash'
import moment from 'moment'

import { EnvironmentConfig } from '~/config'

import { TABLE_DATE_FORMAT } from '../../config/index.config'
import { isStringObject, processRanks, toFixed } from '../utils'

import { MemberSubmission } from './MemberSubmission.model'
import {
    adjustSubmissionReviewResponse,
    SubmissionReview,
} from './SubmissionReview.model'
import { SubmissionReviewSummation } from './SubmissionReviewSummation.model'

/**
 * Model for submission info
 */
export interface Submission {
    updatedBy: string
    created: Date
    legacySubmissionId: number
    isFileSubmission: boolean
    type: string
    submittedDate: Date
    submittedDateString?: string // this field is calculated at frontend
    url: string
    challengeId: number
    createdBy: string
    legacyChallengeId: number
    review: SubmissionReview[]
    reviewSummation?: SubmissionReviewSummation[]
    id: string
    submissionPhaseId: string
    updated: Date
    fileType: string
    memberId: number
    v5ChallengeId: string
    exampleScore?: number // this field is calculated at frontend
    provisionalScore?: number // this field is calculated at frontend
    finalScore?: number // this field is calculated at frontend
    provisionalRank?: number // this field is calculated at frontend
    finalRank?: number // this field is calculated at frontend
    hideToggleHistory?: boolean // this field is calculated at frontend
    isTheLatestSubmission?: boolean // this field is calculated at frontend
}

/**
 * Recalculate submission rank
 * @param memberSubmissions array of member submissions
 * @returns array of member submission
 */
export function recalculateSubmissionRank(
    memberSubmissions: MemberSubmission[],
): MemberSubmission[] {
    _.each(memberSubmissions, memberSubmission => {
        memberSubmission.submissions = memberSubmission.submissions.map(adjustSubmissionResponse)
    })

    const { submissions: finalSubmissions, maxFinalScore }: {
        maxFinalScore: number;
        submissions: MemberSubmission[];
    }
        = processRanks(memberSubmissions)
    finalSubmissions.sort((a, b) => {
        if (maxFinalScore === 0) {
            return (a.provisionalRank ?? 0) - (b.provisionalRank ?? 0)
        }

        return (a.finalRank ?? 0) - (b.finalRank ?? 0)
    })
    let results: Submission[] = []

    _.forEach(finalSubmissions, finalSubmission => {
        finalSubmission.submissions[0].provisionalRank
            = finalSubmission.provisionalRank
        finalSubmission.submissions[0].finalRank = finalSubmission.finalRank
        results = [...results, ...finalSubmission.submissions]
    })

    return finalSubmissions
}

/**
 * Update submissions to show in ui
 * @param data data from backend response
 * @returns array of member submission
 */
export function adjustSubmissionsResponse(
    submissions: Submission[],
): MemberSubmission[] {
    const data: {
        [key: number]: Submission[]
    } = {}
    const result: MemberSubmission[] = []

    _.each(submissions, submission => {
        const { memberId }: Submission = submission
        if (!data[memberId]) {
            data[memberId] = []
        }

        data[memberId].push(submission)
    })

    _.each(data, (value, key) => {
        result.push({
            finalRank: undefined,
            memberId: key as any,
            provisionalRank: undefined,
            submissions: [
                ...value.sort(
                    (a, b) => new Date(b.submittedDate)
                        .getTime()
                    - new Date(a.submittedDate)
                        .getTime(),
                ),
            ],
        })
    })

    return recalculateSubmissionRank(result)
}

/**
 * Update submission to show in ui
 * @param data data from backend response
 * @returns updated data
 */
export function adjustSubmissionResponse(data: Submission): Submission {
    const validReviews = _.reject(data.review, [
        'typeId',
        EnvironmentConfig.ADMIN.AV_SCAN_SCORER_REVIEW_TYPE_ID,
    ])
    const provisionalReviews = _.filter(
        validReviews,
        item => !item.metadata || item.metadata.testType === 'provisional',
    )
    const exampleReviews = _.filter(
        validReviews,
        item => item.metadata?.testType === 'example',
    )
    const finalScore = toFixed(
        _.get(data, 'reviewSummation[0].aggregateScore', undefined),
        5,
    )
    const provisionalScore = toFixed(
        _.get(provisionalReviews, '[0].score', undefined),
        5,
    )
    const exampleScore = toFixed(
        _.get(exampleReviews, '[0].score', undefined),
        5,
    )
    const created
        = data.created && isStringObject(data.created)
            ? new Date(data.created)
            : data.created
    const submittedDate
        = data.submittedDate && isStringObject(data.submittedDate)
            ? new Date(data.submittedDate)
            : data.submittedDate
    const updated
        = data.updated && isStringObject(data.updated)
            ? new Date(data.updated)
            : data.updated

    return {
        ...data,
        created,
        exampleScore: exampleScore as number,
        finalScore: finalScore as number,
        provisionalScore: provisionalScore as number,
        review: (data.review ?? []).map(adjustSubmissionReviewResponse),
        submittedDate,
        submittedDateString: data.submittedDate
            ? moment(data.submittedDate)
                .local()
                .format(TABLE_DATE_FORMAT)
            : data.submittedDate,
        updated,
    }
}
