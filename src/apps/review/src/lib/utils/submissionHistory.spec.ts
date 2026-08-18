import type { SubmissionInfo } from '../models'

import {
    getSubmissionHistoryKey,
    partitionSubmissionHistory,
} from './submissionHistory'

/**
 * Build submission metadata for history-ranking tests.
 *
 * @param id - Submission identifier.
 * @param type - Exact submission type.
 * @param submittedDate - ISO submission timestamp.
 * @returns A submission owned by the shared test member.
 */
function createSubmission(
    id: string,
    type: string,
    submittedDate: string,
): SubmissionInfo {
    return {
        id,
        memberId: 'member-one',
        submittedDate,
        type,
    }
}

const submissions: SubmissionInfo[] = [
    createSubmission('contest-oldest', 'CONTEST_SUBMISSION', '2026-08-10T10:00:00Z'),
    createSubmission('contest-middle', 'CONTEST_SUBMISSION', '2026-08-10T11:00:00Z'),
    createSubmission('contest-newest', 'CONTEST_SUBMISSION', '2026-08-10T12:00:00Z'),
    createSubmission('checkpoint-oldest', 'CHECKPOINT_SUBMISSION', '2026-08-09T10:00:00Z'),
    createSubmission('checkpoint-newest', 'CHECKPOINT_SUBMISSION', '2026-08-09T11:00:00Z'),
]

describe('partitionSubmissionHistory', () => {
    it('retains the latest two submissions independently for each exact type', () => {
        const result = partitionSubmissionHistory(submissions, submissions, {
            visibleSubmissionCount: 2,
        })

        expect(result.latestSubmissionIds)
            .toEqual(new Set([
                'contest-newest',
                'contest-middle',
                'checkpoint-newest',
                'checkpoint-oldest',
            ]))
        expect(result.historyByMember.get(getSubmissionHistoryKey(
            'member-one',
            'contest-newest',
            'CONTEST_SUBMISSION',
        )))
            .toEqual([submissions[0]])
        expect(result.historyByMember.has(getSubmissionHistoryKey(
            'member-one',
            'checkpoint-newest',
            'CHECKPOINT_SUBMISSION',
        )))
            .toBe(false)
    })

    it('defaults finite selection to the latest one per member and type', () => {
        const result = partitionSubmissionHistory(submissions, submissions)

        expect(result.latestSubmissionIds)
            .toEqual(new Set([
                'contest-newest',
                'checkpoint-newest',
            ]))
        expect(result.historyByMember.get(getSubmissionHistoryKey(
            'member-one',
            'contest-newest',
            'CONTEST_SUBMISSION',
        )))
            .toEqual([
                submissions[1],
                submissions[0],
            ])
        expect(result.historyByMember.get(getSubmissionHistoryKey(
            'member-one',
            'checkpoint-newest',
            'CHECKPOINT_SUBMISSION',
        )))
            .toEqual([submissions[3]])
    })

    it('ranks complete history before retaining only eligible primary rows', () => {
        const eligibleOlderSubmission = submissions[1]
        const completeHistory = [
            eligibleOlderSubmission,
            submissions[2],
        ]

        const latestOne = partitionSubmissionHistory(
            [eligibleOlderSubmission],
            completeHistory,
            { visibleSubmissionCount: 1 },
        )
        expect(latestOne.latestSubmissionIds)
            .toEqual(new Set(['contest-newest']))
        expect(latestOne.latestSubmissions)
            .toEqual([])

        const latestTwo = partitionSubmissionHistory(
            [eligibleOlderSubmission],
            completeHistory,
            { visibleSubmissionCount: 2 },
        )
        expect(latestTwo.latestSubmissionIds)
            .toEqual(new Set([
                'contest-newest',
                'contest-middle',
            ]))
        expect(latestTwo.latestSubmissions)
            .toEqual([eligibleOlderSubmission])
    })
})
