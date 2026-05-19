import { xhrPostAsync } from '~/libs/core'

import type {
    BackendSubmission,
    ChallengeInfo,
    SubmissionInfo,
} from '../models'

import {
    canReprocessTopgearSubmission,
    createTopgearSubmissionReprocessPayload,
    reprocessTopgearSubmission,
    TOPGEAR_SUBMISSION_REPROCESS_TOPIC,
} from './submission-reprocess.service'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        API: {
            V5: 'https://api.topcoder.test',
        },
    },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    xhrPostAsync: jest.fn(),
}), { virtual: true })

const baseSubmission: Pick<
    BackendSubmission,
    | 'id'
    | 'challengeId'
    | 'createdAt'
    | 'createdBy'
    | 'memberId'
    | 'submittedDate'
    | 'url'
> = {
    challengeId: '26d1497e-b818-4f6c-8fab-f4b41b6d88bf',
    createdAt: '2026-05-11T14:17:12.364Z',
    createdBy: 'FallbackHandle',
    id: 'okuFYPovWRXWoF',
    memberId: '90428298',
    submittedDate: '2026-05-11T14:17:12.364Z',
    url: 'https://example.com/topgear/submission',
}

const submissionInfo: Pick<
    SubmissionInfo,
    | 'submittedDate'
    | 'submitterHandle'
    | 'userInfo'
> = {
    submittedDate: '2026-05-11T14:17:12.364Z',
    submitterHandle: 'FallbackSubmitter',
    userInfo: {
        challengeId: baseSubmission.challengeId,
        created: '2026-05-11T14:17:12.364Z',
        createdBy: 'review-api-v6',
        id: 'resource-id',
        memberHandle: 'AsimH',
        memberId: baseSubmission.memberId,
        roleId: 'submitter-role-id',
    },
}

describe('submission reprocess service', () => {
    afterEach(() => {
        jest.clearAllMocks()
        jest.useRealTimers()
    })

    it('allows reprocess only for admins on Topgear Task challenges', () => {
        const topgearChallenge = {
            type: {
                id: 'type-id',
                name: 'Topgear Task',
            },
        } as ChallengeInfo
        const designChallenge = {
            type: {
                id: 'design-type-id',
                name: 'Design',
            },
        } as ChallengeInfo

        expect(canReprocessTopgearSubmission(topgearChallenge, true))
            .toBe(true)
        expect(canReprocessTopgearSubmission(topgearChallenge, false))
            .toBe(false)
        expect(canReprocessTopgearSubmission(designChallenge, true))
            .toBe(false)
    })

    it('builds the Topgear submission reprocess payload from submission and registrant data', () => {
        expect(createTopgearSubmissionReprocessPayload({
            submission: baseSubmission,
            submissionInfo,
        }))
            .toEqual({
                challengeId: '26d1497e-b818-4f6c-8fab-f4b41b6d88bf',
                memberHandle: 'AsimH',
                memberId: '90428298',
                submissionId: 'okuFYPovWRXWoF',
                submissionUrl: 'https://example.com/topgear/submission',
                submittedDate: '2026-05-11T14:17:12.364Z',
            })
    })

    it('requires a submission URL before building the reprocess payload', () => {
        expect(() => createTopgearSubmissionReprocessPayload({
            submission: {
                ...baseSubmission,
                url: '',
            },
            submissionInfo,
        }))
            .toThrow('Submission url is not valid')
    })

    it('posts the Topgear reprocess event to the bus API', async () => {
        jest.useFakeTimers()
        jest.setSystemTime(new Date('2026-05-18T10:20:30.000Z'))
        const mockedPost = xhrPostAsync as jest.MockedFunction<typeof xhrPostAsync>
        mockedPost.mockResolvedValue('ok')

        await expect(reprocessTopgearSubmission({
            submission: baseSubmission,
            submissionInfo,
        }))
            .resolves.toBe('ok')

        expect(mockedPost)
            .toHaveBeenCalledWith(
                'https://api.topcoder.test/bus/events',
                {
                    'mime-type': 'application/json',
                    originator: 'review-api-v6',
                    payload: {
                        challengeId: '26d1497e-b818-4f6c-8fab-f4b41b6d88bf',
                        memberHandle: 'AsimH',
                        memberId: '90428298',
                        submissionId: 'okuFYPovWRXWoF',
                        submissionUrl: 'https://example.com/topgear/submission',
                        submittedDate: '2026-05-11T14:17:12.364Z',
                    },
                    timestamp: '2026-05-18T10:20:30.000Z',
                    topic: TOPGEAR_SUBMISSION_REPROCESS_TOPIC,
                },
            )
    })
})
