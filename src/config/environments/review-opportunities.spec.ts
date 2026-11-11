import { REVIEW as defaultReviewConfig } from './default.env'
import { REVIEW as productionReviewConfig } from './prod.env'

describe('Review open opportunities destination', () => {
    it('links development users directly to Review Opportunities', () => {
        expect(defaultReviewConfig.OPPORTUNITIES_URL)
            .toBe('https://www.topcoder-dev.com/opportunities/reviews')
    })

    it('links production users directly to Review Opportunities', () => {
        expect(productionReviewConfig.OPPORTUNITIES_URL)
            .toBe('https://www.topcoder.com/opportunities/reviews')
    })
})
