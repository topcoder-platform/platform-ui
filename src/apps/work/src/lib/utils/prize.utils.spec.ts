import {
    calculateChallengeFee,
    calculateChallengeTotal,
    formatUsdCurrency,
} from './prize.utils'

describe('prize utils challenge total', () => {
    it('adds the displayed reviewer estimate to the billable challenge subtotal', () => {
        const total = calculateChallengeTotal(
            [
                {
                    prizes: [
                        {
                            type: 'USD',
                            value: 12,
                        },
                    ],
                    type: 'PLACEMENT',
                },
                {
                    prizes: [
                        {
                            type: 'USD',
                            value: 5,
                        },
                    ],
                    type: 'COPILOT',
                },
            ],
            [
                {
                    baseCoefficient: 0.13,
                    fixedAmount: 0.6,
                    incrementalCoefficient: 0.05,
                    isMemberReview: true,
                    memberReviewerCount: 1,
                },
            ],
        )

        expect(total)
            .toBeCloseTo(20.36, 2)
    })

    it('only includes copilot payment in the dollar total for point-based challenges', () => {
        const total = calculateChallengeTotal(
            [
                {
                    prizes: [
                        {
                            type: 'POINT',
                            value: 1000,
                        },
                    ],
                    type: 'PLACEMENT',
                },
                {
                    prizes: [
                        {
                            type: 'USD',
                            value: 100,
                        },
                    ],
                    type: 'COPILOT',
                },
            ],
            [
                {
                    baseCoefficient: 0.13,
                    fixedAmount: 0.6,
                    incrementalCoefficient: 0.05,
                    isMemberReview: true,
                    memberReviewerCount: 2,
                },
            ],
        )

        expect(total)
            .toBe(100)
    })

    it('calculates challenge fee from decimal or whole-number markup values', () => {
        expect(calculateChallengeFee(1560, 0.33))
            .toBeCloseTo(514.8, 2)
        expect(calculateChallengeFee(1560, 33))
            .toBeCloseTo(514.8, 2)
    })

    it('formats usd currency values with two decimal places', () => {
        expect(formatUsdCurrency(481.8))
            .toBe('$481.80')
    })
})
