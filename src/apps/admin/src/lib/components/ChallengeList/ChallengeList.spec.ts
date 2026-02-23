import {
    canOpenReviewUi,
    getChallengeLinkId,
    getReviewUiChallengeUrl,
} from './reviewUiLink'

describe('ChallengeList review UI helpers', () => {
    describe('getChallengeLinkId', () => {
        it('returns challenge uuid when present', () => {
            expect(getChallengeLinkId({
                id: 'challenge-uuid',
                legacy: { id: 123_456 },
                legacyId: 654_321,
            }))
                .toBe('challenge-uuid')
        })

        it('falls back to challenge legacyId when id is empty', () => {
            expect(getChallengeLinkId({
                id: '',
                legacyId: 654_321,
            }))
                .toBe('654321')
        })

        it('falls back to challenge legacy.id when id and legacyId are empty', () => {
            expect(getChallengeLinkId({
                id: '',
                legacy: { id: 123_456 },
            }))
                .toBe('123456')
        })

        it('returns undefined when no challenge identifier is available', () => {
            expect(getChallengeLinkId({
                id: '',
                legacy: { id: '' },
                legacyId: '',
            }))
                .toBeUndefined()
        })
    })

    describe('canOpenReviewUi', () => {
        it('returns true when challenge has a uuid id', () => {
            expect(canOpenReviewUi('challenge-uuid'))
                .toBe(true)
        })

        it('returns false when challenge id is empty', () => {
            expect(canOpenReviewUi(''))
                .toBe(false)
        })

        it('returns false when challenge id is only whitespace', () => {
            expect(canOpenReviewUi(' '))
                .toBe(false)
        })
    })

    describe('getReviewUiChallengeUrl', () => {
        it('builds review ui url using challenge id path', () => {
            expect(getReviewUiChallengeUrl('https://review.topcoder-dev.com', 'challenge-uuid'))
                .toBe('https://review.topcoder-dev.com/challenge-uuid')
        })
    })
})
