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
})
