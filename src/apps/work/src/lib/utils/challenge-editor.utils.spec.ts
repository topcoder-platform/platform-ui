import {
    transformChallengeToFormData,
    transformFormDataToChallenge,
} from './challenge-editor.utils'

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

describe('challenge-editor utils funChallenge mapping', () => {
    it('defaults funChallenge to false in form data', () => {
        const result = transformChallengeToFormData({
            description: 'Public specification',
            name: 'MM Fun Challenge',
            trackId: 'track-id',
            typeId: 'type-id',
        })

        expect(result.funChallenge)
            .toBe(false)
    })

    it('keeps funChallenge true when converting challenge to form data', () => {
        const result = transformChallengeToFormData({
            description: 'Public specification',
            funChallenge: true,
            name: 'MM Fun Challenge',
            trackId: 'track-id',
            typeId: 'type-id',
        })

        expect(result.funChallenge)
            .toBe(true)
    })

    it('serializes funChallenge to API payload', () => {
        const formData: Record<string, unknown> = {
            description: 'Public specification',
            funChallenge: true,
            name: 'MM Fun Challenge',
            skills: [],
            tags: [],
            trackId: 'track-id',
            typeId: 'type-id',
        }

        const result = transformFormDataToChallenge(formData as any)

        expect(result.funChallenge)
            .toBe(true)
    })

    it('omits prizeSets from API payload for fun challenges', () => {
        const formData: Record<string, unknown> = {
            description: 'Public specification',
            funChallenge: true,
            name: 'MM Fun Challenge',
            prizeSets: [
                {
                    prizes: [
                        {
                            type: 'USD',
                            value: 500,
                        },
                    ],
                    type: 'placement',
                },
            ],
            skills: [],
            tags: [],
            trackId: 'track-id',
            typeId: 'type-id',
        }

        const result = transformFormDataToChallenge(formData as any)

        expect(result)
            .not
            .toHaveProperty('prizeSets')
    })
})

describe('challenge-editor utils wiproAllowed mapping', () => {
    it('defaults wiproAllowed to false in form data', () => {
        const result = transformChallengeToFormData({
            description: 'Public specification',
            name: 'MM Wipro Challenge',
            trackId: 'track-id',
            typeId: 'type-id',
        })

        expect(result.wiproAllowed)
            .toBe(false)
    })

    it('keeps wiproAllowed true when converting challenge to form data', () => {
        const result = transformChallengeToFormData({
            description: 'Public specification',
            name: 'MM Wipro Challenge',
            trackId: 'track-id',
            typeId: 'type-id',
            wiproAllowed: true,
        })

        expect(result.wiproAllowed)
            .toBe(true)
    })

    it('serializes wiproAllowed to API payload', () => {
        const formData: Record<string, unknown> = {
            description: 'Public specification',
            name: 'MM Wipro Challenge',
            skills: [],
            tags: [],
            trackId: 'track-id',
            typeId: 'type-id',
            wiproAllowed: true,
        }

        const result = transformFormDataToChallenge(formData as any)

        expect(result.wiproAllowed)
            .toBe(true)
    })
})

describe('challenge-editor utils task reviewer mapping', () => {
    it('maps task reviewer and task flag into form data', () => {
        const result = transformChallengeToFormData({
            description: 'Public specification',
            name: 'Task challenge',
            reviewer: 'jcori',
            task: {
                isTask: true,
            },
            trackId: 'track-id',
            typeId: 'type-id',
        })

        expect(result.reviewer)
            .toBe('jcori')
        expect(result.legacy?.isTask)
            .toBe(true)
    })

    it('serializes task reviewer but omits legacy.isTask from API payload', () => {
        const formData: Record<string, unknown> = {
            description: 'Public specification',
            legacy: {
                isTask: true,
                reviewType: 'INTERNAL',
                useSchedulingAPI: true,
            },
            name: 'Task challenge',
            reviewer: 'jcori',
            skills: [],
            tags: [],
            trackId: 'track-id',
            typeId: 'type-id',
        }

        const result = transformFormDataToChallenge(formData as any)

        expect(result.reviewer)
            .toBe('jcori')
        expect(result.legacy)
            .toEqual({
                reviewType: 'INTERNAL',
                useSchedulingAPI: true,
            })
    })
})
