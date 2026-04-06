import type { ChallengeWinner, SubmissionInfo } from '../models'
import { submissionMatchesWinner } from '../utils/winnerMatching'

const buildWinner = (overrides: Partial<ChallengeWinner> = {}): ChallengeWinner => ({
    handle: 'winner-handle',
    placement: 1,
    userId: 1001,
    ...overrides,
})

const buildSubmission = (overrides: Partial<SubmissionInfo> = {}): SubmissionInfo => ({
    id: 'submission-1',
    memberId: '1001',
    placement: 1,
    reviews: [],
    submitterHandle: 'winner-handle',
    ...overrides,
})

describe('submissionMatchesWinner', () => {
    it('matches submissions by member id when the ids agree', () => {
        expect(submissionMatchesWinner(
            buildSubmission(),
            buildWinner(),
        ))
            .toBe(true)
    })

    it('falls back to the submitter handle for legacy winner records', () => {
        expect(submissionMatchesWinner(
            buildSubmission({
                memberId: '9999',
                placement: 4,
            }),
            buildWinner({
                userId: 2002,
            }),
        ))
            .toBe(true)
    })

    it('falls back to placement when member ids and handles do not line up', () => {
        expect(submissionMatchesWinner(
            buildSubmission({
                memberId: '9999',
                placement: 2,
                submitterHandle: 'captain-handle',
            }),
            buildWinner({
                handle: 'group-member',
                placement: 2,
                userId: 3003,
            }),
        ))
            .toBe(true)
    })
})
