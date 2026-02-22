import {
    canOpenReviewUi,
    getReviewUiChallengeUrl,
} from './reviewUiLink'

describe('ChallengeList review UI helpers', () => {
    describe('canOpenReviewUi', () => {
        it('returns true when challenge has a uuid id', () => {
            expect(canOpenReviewUi('challenge-uuid'))
                .toBe(true)
        })

        it('returns false when challenge id is empty', () => {
            expect(canOpenReviewUi(''))
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
