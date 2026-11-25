import _ from 'lodash'
import moment from 'moment'

import {
    marathonExampleScore,
    marathonSubmissionScores,
    rankMarathonScores,
} from '~/apps/opportunities/src/utils/marathon-match.utils'
import { EnvironmentConfig } from '~/config'

import { TABLE_DATE_FORMAT } from '../../config/index.config'
import { processRanks } from '../utils/challenge'
import { toFixed } from '../utils/number'
import { isStringObject } from '../utils/string'

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
    initialScore?: number | null
    provisionalScore?: number // this field is calculated at frontend
    finalScore?: number // this field is calculated at frontend
    provisionalRank?: number // this field is calculated at frontend
    finalRank?: number // this field is calculated at frontend
    hideToggleHistory?: boolean // this field is calculated at frontend
    virusScan?: boolean
    isLatest?: boolean
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
function recalculateSubmissionRank(
    memberSubmissions: MemberSubmission[],
    isMM: boolean,
): MemberSubmission[] {
    const validMemberSubmissions: MemberSubmission[] = _.filter(
        memberSubmissions,
        memberSubmission => !!memberSubmission.submissions
            && !!memberSubmission.submissions.length,
    )
    _.each(validMemberSubmissions, memberSubmission => {
        memberSubmission.submissions = memberSubmission.submissions.map(row => adjustSubmissionResponse(row, isMM))
    })

    if (isMM) {
        const ranks = rankMarathonScores(validMemberSubmissions.map(member => member.submissions[0]))
        validMemberSubmissions.forEach(member => {
            const latest = member.submissions[0]
            const rank = ranks.get(latest.id)
            Object.assign(member, rank)
            Object.assign(latest, rank)
        })
        return _.orderBy(validMemberSubmissions, ['finalRank', 'provisionalRank'])
    }

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

    _.forEach(finalSubmissions, finalSubmission => {
        finalSubmission.submissions[0].provisionalRank
            = finalSubmission.provisionalRank
        finalSubmission.submissions[0].finalRank = finalSubmission.finalRank
    })

    return finalSubmissions
}

/**
 * Update submissions to show in ui
 * @param submissions raw submission rows from all result pages
 * @param isMM whether to apply Marathon Match scoring and leaderboard rules
 * @returns array of member submission
 */
export function adjustSubmissionsResponse(
    submissions: Submission[],
    isMM: boolean = false,
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

            const latestFirst = isMM ? Number(b.isLatest === true) - Number(a.isLatest === true) : 0
            return latestFirst || submittedB.getTime() - submittedA.getTime()
        })

        result.push({
            finalRank: undefined,
            memberId: sortedSubmissions[0]?.memberId ?? key,
            provisionalRank: undefined,
            submissions: sortedSubmissions,
        })
    })

    return recalculateSubmissionRank(result, isMM)
}

/**
 * Update submission to show in ui
 * @param data raw submission row
 * @param isMM whether the submission has phase-specific Marathon Match scores
 * @returns updated data
 */
export function adjustSubmissionResponse(data: Submission, isMM: boolean = false): Submission {
    const normalizedReviews = (data.review ?? []).map(adjustSubmissionReviewResponse)
    const scorerReviews = normalizedReviews.filter(review => (
        review.typeId !== EnvironmentConfig.ADMIN.AV_SCAN_SCORER_REVIEW_TYPE_ID
    ))
    const provisionalReview = scorerReviews.find(review => !review.metadata
        || review.metadata.testType === 'provisional')
    const exampleReview = scorerReviews.find(review => review.metadata?.testType === 'example')
    const score = (review?: SubmissionReview): number | undefined => (
        review?.score ?? review?.initialScore ?? review?.finalScore ?? undefined
    )
    const exampleScore = score(exampleReview)
    const provisionalScore = score(provisionalReview)
    const systemReviews = scorerReviews.filter(review => (
        review.metadata?.testType === 'system' || review.metadata?.testType === 'final'
    ))
    const scoreSource = {
        finalScore: data.finalScore,
        id: data.id,
        initialScore: data.initialScore,
        provisionalScore: data.provisionalScore ?? provisionalScore,
        // Only system reviews can supply the legacy final-score fallback.
        review: systemReviews.map(review => ({ finalScore: score(review), status: review.status ?? undefined })),
        reviewSummation: data.reviewSummation,
    }
    const scores = isMM
        ? {
            ...marathonSubmissionScores(scoreSource),
            exampleScore: marathonExampleScore(scoreSource, data.exampleScore ?? exampleScore),
        } : {
            exampleScore: toFixed(exampleScore, 5),
            finalScore: toFixed(data.reviewSummation?.[0]?.aggregateScore, 5),
            provisionalScore: toFixed(provisionalScore, 5),
        }

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
        ...scores,
        memberId,
        review: normalizedReviews,
        submittedDate,
        submittedDateString,
        updated,
        updatedAt: updatedRaw ?? undefined,
    }
}
