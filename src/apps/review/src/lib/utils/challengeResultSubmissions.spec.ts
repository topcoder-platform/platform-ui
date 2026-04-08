import type { BackendResource, SubmissionInfo } from '../models'

import { buildChallengeResultSubmissionSource } from './challengeResultSubmissions'

const buildResource = (memberId: string, handle: string): BackendResource => ({
    id: `resource-${memberId}`,
    memberHandle: handle,
    memberId,
    roleId: 'submitter-role',
} as BackendResource)

const buildSubmission = (overrides: Partial<SubmissionInfo> = {}): SubmissionInfo => ({
    id: 'submission-1',
    legacySubmissionId: 'legacy-submission-1',
    memberId: '1001',
    reviews: [],
    ...overrides,
})

describe('buildChallengeResultSubmissionSource', () => {
    it('backfills winner submissions with user info and handles from challenge submissions', () => {
        const result = buildChallengeResultSubmissionSource({
            challengeSubmissions: [
                buildSubmission({
                    submitterHandle: 'winner-handle',
                    userInfo: buildResource('1001', 'winner-handle'),
                }),
            ],
            memberMapping: {
                1001: buildResource('1001', 'winner-handle'),
            },
            winnerSubmissions: [
                buildSubmission({
                    submitterHandle: undefined,
                    userInfo: undefined,
                }),
            ],
        })

        expect(result)
            .toHaveLength(1)
        expect(result[0])
            .toMatchObject({
                id: 'submission-1',
                submitterHandle: 'winner-handle',
                userInfo: {
                    memberHandle: 'winner-handle',
                },
            })
    })

    it('deduplicates legacy-equivalent submissions across sources', () => {
        const result = buildChallengeResultSubmissionSource({
            challengeSubmissions: [
                buildSubmission({
                    id: 'submission-legacy-alias',
                    legacySubmissionId: 'legacy-submission-1',
                    submitterHandle: 'winner-handle',
                }),
            ],
            memberMapping: {},
            winnerSubmissions: [
                buildSubmission({
                    id: 'submission-1',
                    legacySubmissionId: 'legacy-submission-1',
                }),
            ],
        })

        expect(result)
            .toHaveLength(1)
        expect(result[0].submitterHandle)
            .toBe('winner-handle')
    })
})
