import { calculateChallengeTotal } from './prize.utils'

describe('prize utils challenge total', () => {
    it('adds reviewer total using first-place prize coefficients without fixed reviewer amounts', () => {
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
            .toBeCloseTo(19.16, 2)
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
})
