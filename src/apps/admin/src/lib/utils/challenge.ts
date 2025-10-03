/**
 * Util for challenge
 */

import _ from 'lodash'

import { Challenge, MemberSubmission } from '../models'

/**
 * Check if the challenge is a marathon match challenge
 * @param challenge challenge info
 * @returns true if challenge is mm
 */
export function checkIsMM(challenge?: Challenge): boolean {
    const tags = _.get(challenge, 'tags') || []
    const isMMType = challenge ? challenge.type === 'Marathon Match' : false
    return tags.includes('Marathon Match') || isMMType
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
