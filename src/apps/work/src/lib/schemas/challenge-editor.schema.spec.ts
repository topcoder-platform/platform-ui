import {
    MAX_MANUAL_REVIEWER_COUNT,
    PRIZE_SET_TYPES,
    PRIZE_TYPES,
    REVIEW_TYPES,
    ROUND_TYPES,
} from '../constants/challenge-editor.constants'
import {
    SUBMISSION_LIMIT_COUNT_REQUIRED_MESSAGE,
} from '../utils/submission-limit.utils'

import {
    challengeAdvancedOptionsSchema,
    challengeBasicInfoSchema,
} from './challenge-editor.schema'

jest.mock('~/config', () => ({
    EnvironmentConfig: new Proxy({
        ADMIN: {
            REVIEW_UI_URL: 'https://review.topcoder-dev.com',
        },
        API: {
            V5: 'https://api.topcoder-dev.com/v5',
            V6: 'https://api.topcoder-dev.com/v6',
        },
    }, {
        get: (target, property: string): unknown => {
            if (property in target) {
                return (target as Record<string, unknown>)[property]
            }

            return 'https://www.topcoder-dev.com'
        },
    }),
}), { virtual: true })

describe('challenge-editor schema task reviewer validation', () => {
    const baseFormData = {
        roundType: ROUND_TYPES.SINGLE_ROUND,
    }

    it('does not require reviewer for task internal review', async () => {
        await expect(
            challengeAdvancedOptionsSchema.validate({
                ...baseFormData,
                legacy: {
                    isTask: true,
                    reviewType: REVIEW_TYPES.INTERNAL,
                },
                reviewer: '',
            }),
        )
            .resolves
            .toBeTruthy()
    })

    it('does not require reviewer for non-task internal review', async () => {
        await expect(
            challengeAdvancedOptionsSchema.validate({
                ...baseFormData,
                legacy: {
                    isTask: false,
                    reviewType: REVIEW_TYPES.INTERNAL,
                },
                reviewer: '',
            }),
        )
            .resolves
            .toBeTruthy()
    })

    it('does not require reviewer for task community review', async () => {
        await expect(
            challengeAdvancedOptionsSchema.validate({
                ...baseFormData,
                legacy: {
                    isTask: true,
                    reviewType: REVIEW_TYPES.COMMUNITY,
                },
                reviewer: '',
            }),
        )
            .resolves
            .toBeTruthy()
    })
})

describe('challenge-editor schema copilot validation', () => {
    const baseFormData = {
        roundType: ROUND_TYPES.SINGLE_ROUND,
    }

    it('requires a copilot when a copilot fee is set', async () => {
        await expect(
            challengeAdvancedOptionsSchema.validate({
                ...baseFormData,
                copilot: '',
                prizeSets: [
                    {
                        prizes: [
                            {
                                type: PRIZE_TYPES.USD,
                                value: 5,
                            },
                        ],
                        type: PRIZE_SET_TYPES.COPILOT,
                    },
                ],
            }),
        )
            .rejects
            .toThrow('Copilot is required when copilot fee is greater than 0')
    })

    it('does not require a copilot when no copilot fee is set', async () => {
        await expect(
            challengeAdvancedOptionsSchema.validate({
                ...baseFormData,
                copilot: '',
                prizeSets: [
                    {
                        prizes: [
                            {
                                type: PRIZE_TYPES.USD,
                                value: 12,
                            },
                        ],
                        type: PRIZE_SET_TYPES.PLACEMENT,
                    },
                ],
            }),
        )
            .resolves
            .toBeTruthy()
    })
})

describe('challenge-editor schema fun challenge prize validation', () => {
    const baseBasicInfo = {
        description: 'This is a valid public specification description with enough details.',
        name: 'Fun challenge basic info',
        skills: [
            {
                id: 'skill-id',
                name: 'JavaScript',
            },
        ],
        tags: [],
        trackId: 'track-id',
        typeId: 'type-id',
    }

    it('allows missing prizeSets when funChallenge is true', async () => {
        await expect(
            challengeBasicInfoSchema.validate({
                ...baseBasicInfo,
                funChallenge: true,
            }),
        )
            .resolves
            .toBeTruthy()
    })

    it('requires placement prizes when funChallenge is false', async () => {
        await expect(
            challengeBasicInfoSchema.validate({
                ...baseBasicInfo,
                funChallenge: false,
            }),
        )
            .rejects
            .toThrow('At least one first-place prize is required')
    })

    it('accepts placement prizes when funChallenge is false', async () => {
        await expect(
            challengeBasicInfoSchema.validate({
                ...baseBasicInfo,
                funChallenge: false,
                prizeSets: [
                    {
                        prizes: [
                            {
                                type: 'USD',
                                value: 500,
                            },
                        ],
                        type: PRIZE_SET_TYPES.PLACEMENT,
                    },
                ],
            }),
        )
            .resolves
            .toBeTruthy()
    })

    it('allows equal lower placement prizes when funChallenge is false', async () => {
        await expect(
            challengeBasicInfoSchema.validate({
                ...baseBasicInfo,
                funChallenge: false,
                prizeSets: [
                    {
                        prizes: [
                            {
                                type: 'USD',
                                value: 100,
                            },
                            {
                                type: 'USD',
                                value: 50,
                            },
                            {
                                type: 'USD',
                                value: 20,
                            },
                            {
                                type: 'USD',
                                value: 20,
                            },
                        ],
                        type: PRIZE_SET_TYPES.PLACEMENT,
                    },
                ],
            }),
        )
            .resolves
            .toBeTruthy()
    })

    it('rejects lower placement prizes that increase when funChallenge is false', async () => {
        await expect(
            challengeBasicInfoSchema.validate({
                ...baseBasicInfo,
                funChallenge: false,
                prizeSets: [
                    {
                        prizes: [
                            {
                                type: 'USD',
                                value: 100,
                            },
                            {
                                type: 'USD',
                                value: 50,
                            },
                            {
                                type: 'USD',
                                value: 60,
                            },
                        ],
                        type: PRIZE_SET_TYPES.PLACEMENT,
                    },
                ],
            }),
        )
            .rejects
            .toThrow('Placement prizes must stay the same or decrease for lower placements')
    })
})

describe('challenge-editor schema test challenge default', () => {
    it('defaults isTestChallenge to false', () => {
        const result = challengeBasicInfoSchema.cast({
            description: 'This is a valid public specification description.',
            funChallenge: true,
            name: 'Default test flag challenge',
            skills: [{
                id: 'skill-id',
                name: 'JavaScript',
            }],
            tags: [],
            trackId: 'track-id',
            typeId: 'type-id',
        })

        expect(result.isTestChallenge)
            .toBe(false)
    })
})

describe('challenge-editor schema gitea teams validation', () => {
    const baseFormData = {
        description: 'This is a valid public specification description.',
        name: 'Gitea configured challenge',
        skills: [{
            id: 'skill-id',
            name: 'JavaScript',
        }],
        tags: [],
        trackId: 'track-id',
        typeId: 'type-id',
    }

    it('defaults giteaTeams to an empty list', () => {
        const result = challengeBasicInfoSchema.cast(baseFormData)

        expect(result.giteaTeams)
            .toEqual([])
    })

    it('accepts a list of distinct teams', async () => {
        await expect(
            challengeBasicInfoSchema.validateAt('giteaTeams', {
                ...baseFormData,
                giteaTeams: [
                    { id: 12, name: 'devs', organization: 'topcoder' },
                    { id: 34, name: 'reviewers', organization: 'partner' },
                ],
            }),
        )
            .resolves
            .toEqual([
                { id: 12, name: 'devs', organization: 'topcoder' },
                { id: 34, name: 'reviewers', organization: 'partner' },
            ])
    })

    it('rejects duplicated teams', async () => {
        await expect(
            challengeBasicInfoSchema.validateAt('giteaTeams', {
                ...baseFormData,
                giteaTeams: [
                    { id: 12, name: 'devs', organization: 'topcoder' },
                    { id: 12, name: 'devs', organization: 'topcoder' },
                ],
            }),
        )
            .rejects
            .toThrow('Gitea teams must be unique')
    })

    it('rejects a team without an id', async () => {
        await expect(
            challengeBasicInfoSchema.validateAt('giteaTeams', {
                ...baseFormData,
                giteaTeams: [{ name: 'devs', organization: 'topcoder' }],
            }),
        )
            .rejects
            .toThrow('Gitea team id is required')
    })
})

describe('challenge-editor schema reviewer slot assignment validation', () => {
    const baseFormData = {
        roundType: ROUND_TYPES.SINGLE_ROUND,
    }

    it('flags the next missing member slot when opportunity is closed', async () => {
        await expect(
            challengeAdvancedOptionsSchema.validate({
                ...baseFormData,
                phases: [{
                    name: 'Review',
                    phaseId: 'review-phase-id',
                }],
                reviewers: [
                    {
                        isMemberReview: true,
                        memberId: '1111',
                        memberReviewerCount: 2,
                        phaseId: 'review-phase-id',
                        scorecardId: 'scorecard-id',
                        shouldOpenOpportunity: false,
                    },
                ],
            }),
        )
            .rejects
            .toMatchObject({
                path: 'reviewers[0].additionalMemberIds.0',
            })
    })

    it('accepts an unassigned screener for the standard Screening phase', async () => {
        await expect(
            challengeAdvancedOptionsSchema.validate({
                ...baseFormData,
                phases: [{
                    id: 'screening-phase-instance-id',
                    name: 'Screening',
                    phaseId: 'screening-phase-template-id',
                }],
                reviewers: [
                    {
                        additionalMemberIds: [],
                        isMemberReview: true,
                        memberReviewerCount: 2,
                        phaseId: 'screening-phase-instance-id',
                        scorecardId: 'screening-scorecard-id',
                        shouldOpenOpportunity: false,
                    },
                ],
            }),
        )
            .resolves
            .toBeTruthy()
    })

    it('accepts an unassigned checkpoint screener for the Checkpoint Screening phase', async () => {
        await expect(
            challengeAdvancedOptionsSchema.validate({
                ...baseFormData,
                phases: [{
                    id: 'checkpoint-screening-phase-instance-id',
                    name: 'Checkpoint Screening',
                    phaseId: 'checkpoint-screening-phase-id',
                }],
                reviewers: [
                    {
                        isMemberReview: true,
                        memberReviewerCount: 1,
                        phaseId: 'checkpoint-screening-phase-instance-id',
                        scorecardId: 'checkpoint-screening-scorecard-id',
                        shouldOpenOpportunity: false,
                    },
                ],
            }),
        )
            .resolves
            .toBeTruthy()
    })

    it('accepts unassigned Design copilot review phases', async () => {
        await expect(
            challengeAdvancedOptionsSchema.validate(
                {
                    ...baseFormData,
                    phases: [
                        {
                            name: 'Review',
                            phaseId: 'review-phase-id',
                        },
                        {
                            name: 'Approval',
                            phaseId: 'approval-phase-id',
                        },
                    ],
                    reviewers: [
                        {
                            isMemberReview: true,
                            memberReviewerCount: 1,
                            phaseId: 'review-phase-id',
                            scorecardId: 'review-scorecard-id',
                            shouldOpenOpportunity: false,
                        },
                        {
                            isMemberReview: true,
                            memberReviewerCount: 1,
                            phaseId: 'approval-phase-id',
                            scorecardId: 'approval-scorecard-id',
                            shouldOpenOpportunity: false,
                        },
                    ],
                },
                {
                    context: {
                        isDesignChallenge: true,
                    },
                },
            ),
        )
            .resolves
            .toBeTruthy()
    })

    it('still requires review assignments outside Design challenges', async () => {
        await expect(
            challengeAdvancedOptionsSchema.validate(
                {
                    ...baseFormData,
                    phases: [{
                        name: 'Review',
                        phaseId: 'review-phase-id',
                    }],
                    reviewers: [
                        {
                            isMemberReview: true,
                            memberReviewerCount: 1,
                            phaseId: 'review-phase-id',
                            scorecardId: 'review-scorecard-id',
                            shouldOpenOpportunity: false,
                        },
                    ],
                },
                {
                    context: {
                        isDesignChallenge: false,
                    },
                },
            ),
        )
            .rejects
            .toMatchObject({
                path: 'reviewers[0].memberId',
            })
    })

    it('accepts required reviewer slot assignments when opportunity is closed', async () => {
        await expect(
            challengeAdvancedOptionsSchema.validate({
                ...baseFormData,
                reviewers: [
                    {
                        additionalMemberIds: ['2222'],
                        isMemberReview: true,
                        memberId: '1111',
                        memberReviewerCount: 2,
                        scorecardId: 'scorecard-id',
                        shouldOpenOpportunity: false,
                    },
                ],
            }),
        )
            .resolves
            .toBeTruthy()
    })

    it('accepts a persisted member handle while its member id is resolved during save', async () => {
        await expect(
            challengeAdvancedOptionsSchema.validate({
                ...baseFormData,
                reviewers: [
                    {
                        handle: 'TCConnCopilot',
                        isMemberReview: true,
                        memberReviewerCount: 1,
                        scorecardId: 'scorecard-id',
                        shouldOpenOpportunity: false,
                    },
                ],
            }),
        )
            .resolves
            .toBeTruthy()
    })

    it('rejects reviewer counts above the manual reviewer limit', async () => {
        await expect(
            challengeAdvancedOptionsSchema.validate({
                ...baseFormData,
                reviewers: [
                    {
                        isMemberReview: true,
                        memberReviewerCount: MAX_MANUAL_REVIEWER_COUNT + 1,
                        scorecardId: 'scorecard-id',
                        shouldOpenOpportunity: true,
                    },
                ],
            }),
        )
            .rejects
            .toThrow(`Number of reviewers cannot exceed ${MAX_MANUAL_REVIEWER_COUNT}`)
    })
})

describe('challenge-editor schema submission limit validation', () => {
    const baseFormData = {
        roundType: ROUND_TYPES.SINGLE_ROUND,
    }
    const configurableContext = {
        context: {
            isSubmissionLimitConfigurable: true,
        },
    }

    function buildSubmissionLimitMetadata(count: string, limit: string): Array<{
        name: string
        value: string
    }> {
        return [{
            name: 'submissionLimit',
            value: JSON.stringify({
                count,
                limit,
                unlimited: limit === 'true'
                    ? 'false'
                    : 'true',
            }),
        }]
    }

    it('rejects a limited submission setting without a count', async () => {
        await expect(
            challengeAdvancedOptionsSchema.validate(
                {
                    ...baseFormData,
                    metadata: buildSubmissionLimitMetadata('', 'true'),
                },
                configurableContext,
            ),
        )
            .rejects
            .toThrow(SUBMISSION_LIMIT_COUNT_REQUIRED_MESSAGE)
    })

    it('reports the missing count on the visible limit field', async () => {
        await expect(
            challengeAdvancedOptionsSchema.validate(
                {
                    ...baseFormData,
                    metadata: buildSubmissionLimitMetadata('', 'true'),
                },
                configurableContext,
            ),
        )
            .rejects
            .toMatchObject({
                path: 'submissionLimitCount',
            })
    })

    it('rejects a limited submission setting with a zero count', async () => {
        await expect(
            challengeAdvancedOptionsSchema.validate(
                {
                    ...baseFormData,
                    metadata: buildSubmissionLimitMetadata('0', 'true'),
                },
                configurableContext,
            ),
        )
            .rejects
            .toThrow(SUBMISSION_LIMIT_COUNT_REQUIRED_MESSAGE)
    })

    it('accepts a limited submission setting with a count', async () => {
        await expect(
            challengeAdvancedOptionsSchema.validate(
                {
                    ...baseFormData,
                    metadata: buildSubmissionLimitMetadata('2', 'true'),
                },
                configurableContext,
            ),
        )
            .resolves
            .toBeTruthy()
    })

    it('accepts an unlimited submission setting', async () => {
        await expect(
            challengeAdvancedOptionsSchema.validate(
                {
                    ...baseFormData,
                    metadata: buildSubmissionLimitMetadata('', 'false'),
                },
                configurableContext,
            ),
        )
            .resolves
            .toBeTruthy()
    })

    it('skips the count rule when the submission limit is not configurable', async () => {
        await expect(
            challengeAdvancedOptionsSchema.validate({
                ...baseFormData,
                metadata: buildSubmissionLimitMetadata('', 'true'),
            }),
        )
            .resolves
            .toBeTruthy()
    })
})
