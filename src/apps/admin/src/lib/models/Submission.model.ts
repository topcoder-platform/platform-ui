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
  id: string
  type: string
  status?: string
  url: string | null
  memberId: string | null
  challengeId: string | null
    legacySubmissionId?: string | null
    legacyChallengeId?: number | string | null
    legacyUploadId?: string | null
    submissionPhaseId?: string | null
    submittedDate: Date | string | null
    submittedDateString?: string // this field is calculated at frontend
    createdBy: string
    created?: Date | string | null
    createdAt?: Date | string | null
    updatedBy: string | null
    updated?: Date | string | null
    updatedAt?: Date | string | null
    fileType?: string | null
    prizeId?: number | string | null
    isFileSubmission?: boolean
    review: SubmissionReview[]
    reviewSummation?: SubmissionReviewSummation[]
    exampleScore?: number // this field is calculated at frontend
    provisionalScore?: number // this field is calculated at frontend
    finalScore?: number // this field is calculated at frontend
    provisionalRank?: number // this field is calculated at frontend
    finalRank?: number // this field is calculated at frontend
    hideToggleHistory?: boolean // this field is calculated at frontend
  isTheLatestSubmission?: boolean // this field is calculated at frontend
  // Enriched fields from API (Admin/Copilot/M2M only)
  submitterHandle?: string
  submitterMaxRating?: number | null
}

/**
 * Recalculate submission rank
 * @param memberSubmissions array of member submissions
 * @returns array of member submission
 */
export function recalculateSubmissionRank(
    memberSubmissions: MemberSubmission[],
): MemberSubmission[] {
    const validMemberSubmissions: MemberSubmission[] = _.filter(
        memberSubmissions,
        memberSubmission => !!memberSubmission.submissions
            && !!memberSubmission.submissions.length,
    )
    _.each(validMemberSubmissions, memberSubmission => {
        memberSubmission.submissions = memberSubmission.submissions.map(adjustSubmissionResponse)
    })

    const { submissions: finalSubmissions, maxFinalScore }: {
        maxFinalScore: number;
        submissions: MemberSubmission[];
    }
        = processRanks(validMemberSubmissions)
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
    const grouped: Record<string, Submission[]> = {}
    _.each(submissions, submission => {
        if (!submission) {
            return
        }

        const memberKey = submission.memberId
            ?? submission.createdBy
            ?? submission.id
        const key = String(memberKey)

        if (!grouped[key]) {
            grouped[key] = []
        }

        grouped[key].push(submission)
    })

    const result: MemberSubmission[] = []

    _.each(grouped, (value, key) => {
        const sortedSubmissions = [...value].sort((a, b) => {
            const submittedB = b.submittedDate
                ? new Date(b.submittedDate)
                : new Date(0)
            const submittedA = a.submittedDate
                ? new Date(a.submittedDate)
                : new Date(0)

            return submittedB.getTime() - submittedA.getTime()
        })

        result.push({
            finalRank: undefined,
            memberId: sortedSubmissions[0]?.memberId ?? key,
            provisionalRank: undefined,
            submissions: sortedSubmissions,
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
    const getNormalizedReviews = (
        input: Submission,
    ): {
        example: SubmissionReview[]
        normalized: SubmissionReview[]
        provisional: SubmissionReview[]
    } => {
        const normalized = (input.review ?? []).map(
            adjustSubmissionReviewResponse,
        )
        const valid = _.reject(normalized, [
            'typeId',
            EnvironmentConfig.ADMIN.AV_SCAN_SCORER_REVIEW_TYPE_ID,
        ])
        const provisional = _.filter(
            valid,
            item => !item.metadata || item.metadata.testType === 'provisional',
        )
        const example = _.filter(
            valid,
            item => item.metadata?.testType === 'example',
        )

        return { example, normalized, provisional }
    }

    const {
        normalized: normalizedReviews,
        provisional: provisionalReviews,
        example: exampleReviews,
    }: {
        normalized: SubmissionReview[]
        provisional: SubmissionReview[]
        example: SubmissionReview[]
    } = getNormalizedReviews(data)
    const extractScore = (review?: SubmissionReview): number | undefined => {
        if (!review) {
            return undefined
        }

        const score = review.score ?? review.initialScore ?? review.finalScore

        return score ?? undefined
    }

    const finalScore = toFixed(
        _.get(data, 'reviewSummation[0].aggregateScore', undefined),
        5,
    )
    const provisionalScore = toFixed(
        extractScore(provisionalReviews[0]),
        5,
    )
    const exampleScore = toFixed(
        extractScore(exampleReviews[0]),
        5,
    )

    const toDate = (
        value?: Date | string | null,
    ): Date | string | undefined => {
        if (value === undefined) {
            return undefined
        }

        return isStringObject(value)
            ? new Date(value as string)
            : (value as Date | string | undefined)
    }

    const createdRaw = data.createdAt ?? data.created
    const created = toDate(createdRaw)
    const updatedRaw = data.updatedAt ?? data.updated
    const updated = toDate(updatedRaw)
    const submittedRaw = data.submittedDate
    const submittedDateNormalized = toDate(submittedRaw)
    const submittedDate = submittedDateNormalized ?? data.submittedDate
    const submittedDateString = submittedRaw
        ? moment(submittedRaw)
            .local()
            .format(TABLE_DATE_FORMAT)
        : undefined

    const memberId
        = typeof data.memberId === 'string'
            ? data.memberId.toString()
            : data.memberId
    const challengeId
        = typeof data.challengeId === 'string'
            ? data.challengeId.toString()
            : data.challengeId

    return {
        ...data,
        challengeId,
        created,
        createdAt: createdRaw ?? undefined,
        exampleScore: exampleScore as number,
        finalScore: finalScore as number,
        memberId,
        provisionalScore: provisionalScore as number,
        review: normalizedReviews,
        submittedDate,
        submittedDateString,
        updated,
        updatedAt: updatedRaw ?? undefined,
    }
}
