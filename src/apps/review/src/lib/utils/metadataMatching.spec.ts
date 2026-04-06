import { isPhaseAllowedForReview } from './metadataMatching'

describe('isPhaseAllowedForReview', () => {
    it('accepts specification review as a review-bearing legacy phase', () => {
        expect(isPhaseAllowedForReview('Specification Review'))
            .toBe(true)
    })

    it('keeps screening phases excluded from review matching', () => {
        expect(isPhaseAllowedForReview('Screening'))
            .toBe(false)
    })
})
