import { adjustSubmissionsResponse, Submission } from './Submission.model'
import { SubmissionReviewSummation } from './SubmissionReviewSummation.model'

jest.mock('~/config', () => ({
    EnvironmentConfig: { ADMIN: { AV_SCAN_SCORER_REVIEW_TYPE_ID: 'scan' } },
}), { virtual: true })
jest.mock('~/apps/opportunities/src/utils/marathon-match.utils', () => (
    jest.requireActual('../../../../opportunities/src/utils/marathon-match.utils')
), { virtual: true })

function result(flags: Partial<SubmissionReviewSummation>, aggregateScore: number): SubmissionReviewSummation {
    return { aggregateScore, createdAt: '2026-11-24', id: String(aggregateScore), submissionId: 'attempt', ...flags }
}

function attempt(id: string, memberId: string, ...reviewSummation: SubmissionReviewSummation[]): Submission {
    return {
        challengeId: 'match',
        createdBy: memberId,
        id,
        memberId,
        review: [],
        reviewSummation,
        submittedDate: '2026-11-24T12:00:00Z',
        type: 'CONTEST_SUBMISSION',
        updatedBy: memberId,
        url: 'submission.zip',
    }
}

describe('Marathon Match submission management', () => {
    it('shows independent example and provisional scores and ranks only the latest scored attempts', () => {
        const first = attempt(
            'first',
            'a',
            result({ isProvisional: true }, 97.99848988221082),
            result({ isExample: true }, 100),
        )
        // The API can distinguish the latest attempt even when timestamps tie.
        first.isLatest = true
        const history = attempt('old', 'a', result({ isProvisional: true }, 101))
        const second = attempt('second', 'b', result({ isExample: true }, 25), result({ isProvisional: true }, 18))
        const third = attempt('third', 'c', result({ isExample: true }, 7), result({ isProvisional: true }, 4))
        const pending = attempt('pending', 'd', result({ isExample: true }, 0))
        const groups = adjustSubmissionsResponse([pending, third, history, second, first], true)
        const rows = groups.map(group => group.submissions[0])
        expect(rows.map(row => [row.id, row.exampleScore, row.provisionalScore, row.provisionalRank]))
            .toEqual([
                ['first', 100, 97.99848988221082, 1], ['second', 25, 18, 2], ['third', 7, 4, 3],
                ['pending', 0, undefined, undefined],
            ])
        expect(rows.every(row => row.finalScore === undefined && row.finalRank === undefined))
            .toBe(true)
        expect(groups[0].submissions[1])
            .toMatchObject({ id: 'old', provisionalScore: 101 })
        expect(groups[0].submissions[1].provisionalRank)
            .toBeUndefined()
    })

    it('keeps legacy scorer reviews in their own columns and excludes antivirus scores', () => {
        const row = attempt('legacy', 'member')
        const review = { createdBy: 'scorer', id: 'review', submissionId: row.id, updatedBy: 'scorer' }
        row.review = [
            { ...review, score: 100, typeId: 'scan' },
            { ...review, metadata: { testType: 'example' }, score: 2 },
            { ...review, metadata: { testType: 'provisional' }, score: 8 },
        ]
        expect(adjustSubmissionsResponse([row], true)[0].submissions[0])
            .toMatchObject({ exampleScore: 2, finalScore: undefined, provisionalRank: 1, provisionalScore: 8 })
    })

    it('ranks settled system scores independently, including tied zeroes, and ignores unfinished reruns', () => {
        const first = attempt('first', 'a', result({ isFinal: true }, 0), result({ isProvisional: true }, 9))
        const second = attempt('second', 'b', result({ isProvisional: true }, 15), result({ isFinal: true }, 0))
        const rerun = attempt(
            'rerun',
            'c',
            result({ isFinal: true }, 30),
            result({ createdAt: '2026-11-25', isFinal: true, metadata: { testStatus: 'IN_PROGRESS' } }, 55),
        )
        const rows = adjustSubmissionsResponse([first, second, rerun], true)
            .map(group => group.submissions[0])
        expect(rows.map(row => [row.id, row.finalScore, row.finalRank, row.provisionalRank]))
            .toEqual([['second', 0, 1, 1], ['first', 0, 1, 2], ['rerun', undefined, undefined, undefined]])
        const cleared = adjustSubmissionsResponse([{ ...first, reviewSummation: [] }, second], true)
        expect(cleared[1].submissions[0].finalScore)
            .toBeUndefined()
        expect(cleared[1].submissions[0].finalRank)
            .toBeUndefined()
    })
})
