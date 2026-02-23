import {
    PRIZE_SET_TYPES,
    REVIEW_TYPES,
    ROUND_TYPES,
} from '../constants/challenge-editor.constants'

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

    it('requires reviewer for task internal review', async () => {
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
            .rejects
            .toThrow('Select a reviewer')
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
})
