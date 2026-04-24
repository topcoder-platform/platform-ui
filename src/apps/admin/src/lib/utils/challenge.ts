/**
 * Util for challenge
 */

import _ from 'lodash'

import { SUBMISSION_REPROCESS_TOPICS } from '../../config/busEvent.config'
import { Challenge, MemberSubmission } from '../models'

const CONTEST_SUBMISSION_TYPE = 'CONTEST_SUBMISSION'
const CHECKPOINT_SUBMISSION_TYPE = 'CHECKPOINT_SUBMISSION'
const CHECKPOINT_MANUAL_UPLOAD_PHASES = new Set([
    'checkpoint screening',
    'checkpoint review',
])

const normalizePhaseName = (value?: string): string => (
    value?.trim()
        .toLowerCase() ?? ''
)

/**
 * Check if the challenge is a marathon match challenge
 * @param challenge challenge info
 * @returns true if challenge is mm
 */
export function checkIsMM(challenge?: Challenge): boolean {
    const tags = _.get(challenge, 'tags') || []
    const typeName = challenge ? _.get(challenge, 'type.name') as string | undefined : undefined
    const isMMType = typeName === 'Marathon Match'
    return tags.includes('Marathon Match') || isMMType
}

/**
 * Resolve submission reprocess topic based on challenge type
 * @param challenge challenge info
 * @returns kafka topic for submission reprocess
 */
export function getSubmissionReprocessTopic(
    challenge?: Challenge,
): string | undefined {
    const normalizedType = challenge?.type?.name
        ? challenge.type.name.replace(/\s+/g, '')
            .toLowerCase()
        : ''

    if (normalizedType === 'first2finish') {
        return SUBMISSION_REPROCESS_TOPICS.FIRST2FINISH
    }

    if (normalizedType === 'topgeartask') {
        return SUBMISSION_REPROCESS_TOPICS.TOPGEAR_TASK
    }

    return undefined
}

/**
 * Resolve the submission type used by the admin manual-upload flow.
 * Checkpoint uploads are only valid once checkpoint review phases are active,
 * so the admin UI switches to checkpoint submission type whenever the
 * challenge is currently in Checkpoint Screening or Checkpoint Review.
 * @param challenge challenge info
 * @returns submission type expected by review-api-v6 manual upload endpoint
 */
export function resolveManualUploadSubmissionType(
    challenge?: Challenge,
): string {
    const hasOpenCheckpointManualUploadPhase = (challenge?.phases ?? []).some(
        phase => phase?.isOpen
            && CHECKPOINT_MANUAL_UPLOAD_PHASES.has(
                normalizePhaseName(phase?.name),
            ),
    )

    return hasOpenCheckpointManualUploadPhase
        ? CHECKPOINT_SUBMISSION_TYPE
        : CONTEST_SUBMISSION_TYPE
}

/**
 * Process each submission rank of MM challenge
 * @param submissions the array of submissions
 * @returns submission after process rank
 */
export function processRanks(submissions: MemberSubmission[]): {
    maxFinalScore: number
    submissions: MemberSubmission[]
} {
    let maxFinalScore
        = _.get(submissions[0], 'submissions[0]', {
            finalScore: 0,
        }).finalScore ?? 0
    submissions.sort((a, b) => {
        let pA = _.get(a, 'submissions[0]', {
            provisionalScore: 0,
        }).provisionalScore
        let pB = _.get(b, 'submissions[0]', {
            provisionalScore: 0,
        }).provisionalScore
        if (pA === undefined) pA = 0
        if (pB === undefined) pB = 0
        if (pA === pB) {
            const timeA = _.get(
                a,
                'submissions[0].submittedDate',
            ) as Date | null | undefined
            const timeB = _.get(
                b,
                'submissions[0].submittedDate',
            ) as Date | null | undefined
            const dateA = timeA instanceof Date ? timeA : new Date(0)
            const dateB = timeB instanceof Date ? timeB : new Date(0)
            return dateA.getTime() - dateB.getTime()
        }

        return pB - pA
    })
    _.each(submissions, (submission, i) => {
        if (!submission.provisionalRank) {
            submission.provisionalRank = 0
        }

        submission.provisionalRank = i + 1
    })

    submissions.sort((a, b) => {
        let pA = _.get(a, 'submissions[0]', { finalScore: 0 }).finalScore
        let pB = _.get(b, 'submissions[0]', { finalScore: 0 }).finalScore
        if (pA === undefined) pA = 0
        if (pB === undefined) pB = 0
        if (pA > 0) maxFinalScore = pA
        if (pB > 0) maxFinalScore = pB
        if (pA === pB) {
            const timeA = _.get(
                a,
                'submissions[0].submittedDate',
            ) as Date | null | undefined
            const timeB = _.get(
                b,
                'submissions[0].submittedDate',
            ) as Date | null | undefined
            const dateA = timeA instanceof Date ? timeA : new Date(0)
            const dateB = timeB instanceof Date ? timeB : new Date(0)
            return dateA.getTime() - dateB.getTime()
        }

        return pB - pA
    })
    if (maxFinalScore > 0) {
        _.each(submissions, (submission, i) => {
            if (!submission.finalRank) {
                submission.finalRank = 0
            }

            submission.finalRank = i + 1
        })
    }

    return { maxFinalScore, submissions }
}
