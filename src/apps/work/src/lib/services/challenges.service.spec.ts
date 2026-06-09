/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    xhrPatchAsync,
    xhrGetAsync,
    xhrGetPaginatedAsync,
} from '~/libs/core'

import {
    fetchChallenges,
    fetchDefaultReviewers,
    patchChallenge,
} from './challenges.service'

jest.mock('~/apps/review/src/lib/services/file-upload.service', () => ({
    uploadReviewAttachment: jest.fn(),
}), {
    virtual: true,
})
jest.mock('~/libs/core', () => ({
    xhrCreateInstance: jest.fn(() => ({
        defaults: {
            headers: {
                common: {},
            },
        },
    })),
    xhrDeleteAsync: jest.fn(),
    xhrGetAsync: jest.fn(),
    xhrGetPaginatedAsync: jest.fn(),
    xhrPatchAsync: jest.fn(),
    xhrPostAsync: jest.fn(),
    xhrPutAsync: jest.fn(),
}), {
    virtual: true,
})
jest.mock('../constants', () => ({
    CHALLENGE_API_URL: 'https://example.com/challenges',
    CHALLENGE_API_VERSION: 'v5',
    CHALLENGE_DEFAULT_REVIEWERS_URL: 'https://example.com/default-reviewers',
    CHALLENGE_TYPES_API_URL: 'https://example.com/challenge-types',
    REVIEW_TYPE_API_URL: 'https://example.com/review-types',
    SCORECARDS_API_URL: 'https://example.com/scorecards',
    UPDATE_SKILLS_V5_API_URL: 'https://example.com/skills',
    WORKFLOWS_API_URL: 'https://example.com/workflows',
}))
jest.mock('../constants/challenge-editor.constants', () => ({
    PHASE_DURATION_MAX_HOURS: 24,
    PHASE_DURATION_MIN_MINUTES: 15,
}))
jest.mock('../utils', () => ({
    normalizeChallengeData: jest.fn((challenge: unknown) => challenge),
}))

describe('fetchChallenges', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        const mockedGetPaginated = xhrGetPaginatedAsync as jest.Mock

        mockedGetPaginated.mockResolvedValue({
            data: [],
            page: 2,
            perPage: 25,
            total: 0,
            totalPages: 0,
        })
    })

    it('includes memberId in the challenge query when provided', async () => {
        await fetchChallenges({
            memberId: 12345,
            name: 'Copilot Challenge',
        }, {
            page: 2,
            perPage: 25,
        })

        expect(xhrGetPaginatedAsync)
            .toHaveBeenCalledWith(
                expect.stringContaining('memberId=12345'),
                expect.objectContaining({
                    defaults: expect.objectContaining({
                        headers: expect.objectContaining({
                            common: expect.objectContaining({
                                'app-version': 'v5',
                            }),
                        }),
                    }),
                }),
            )
        expect(xhrGetPaginatedAsync)
            .toHaveBeenCalledWith(
                expect.stringContaining('name=Copilot+Challenge'),
                expect.any(Object),
            )
    })
})

describe('fetchDefaultReviewers', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('preserves shouldOpenOpportunity from the API response', async () => {
        const mockedGet = xhrGetAsync as jest.Mock

        mockedGet.mockResolvedValue([
            {
                isMemberReview: true,
                memberReviewerCount: 1,
                phaseId: 'phase-1',
                roleId: 'role-1',
                scorecardId: 'scorecard-1',
                shouldOpenOpportunity: true,
            },
        ])

        await expect(fetchDefaultReviewers('type-1', 'track-1'))
            .resolves.toEqual([
                {
                    isMemberReview: true,
                    memberReviewerCount: 1,
                    phaseId: 'phase-1',
                    roleId: 'role-1',
                    scorecardId: 'scorecard-1',
                    shouldOpenOpportunity: true,
                },
            ])
    })
})

describe('patchChallenge', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('preserves reviewer type when serializing manual reviewers', async () => {
        const mockedPatch = xhrPatchAsync as jest.Mock

        mockedPatch.mockResolvedValue({
            id: 'challenge-1',
            reviewers: [],
        })

        await patchChallenge('challenge-1', {
            reviewers: [{
                isMemberReview: true,
                memberReviewerCount: 1,
                phaseId: 'phase-1',
                scorecardId: 'scorecard-1',
                shouldOpenOpportunity: false,
                type: 'ITERATIVE_REVIEW',
            }],
        })

        expect(xhrPatchAsync)
            .toHaveBeenCalledWith(
                'https://example.com/challenges/challenge-1',
                expect.objectContaining({
                    reviewers: [
                        expect.objectContaining({
                            type: 'ITERATIVE_REVIEW',
                        }),
                    ],
                }),
                expect.any(Object),
            )
    })

    it('preserves scheduled phase end dates when patching a challenge', async () => {
        const mockedPatch = xhrPatchAsync as jest.Mock

        mockedPatch.mockResolvedValue({
            id: 'challenge-1',
            phases: [],
        })

        await patchChallenge('challenge-1', {
            phases: [{
                duration: 1440,
                id: 'challenge-phase-1',
                phaseId: 'submission-phase',
                scheduledEndDate: '2026-04-15T15:05:00.000Z',
                scheduledStartDate: '2026-04-09T15:05:00.000Z',
            }],
        })

        expect(xhrPatchAsync)
            .toHaveBeenCalledWith(
                'https://example.com/challenges/challenge-1',
                expect.objectContaining({
                    phases: [{
                        duration: 86400,
                        id: 'challenge-phase-1',
                        phaseId: 'submission-phase',
                        scheduledEndDate: '2026-04-15T15:05:00.000Z',
                        scheduledStartDate: '2026-04-09T15:05:00.000Z',
                    }],
                }),
                expect.any(Object),
            )
    })
})
