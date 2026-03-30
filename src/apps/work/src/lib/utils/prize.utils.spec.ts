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
})
