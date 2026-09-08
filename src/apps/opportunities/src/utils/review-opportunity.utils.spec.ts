import { ReviewOpportunity } from '../models'

import {
    reviewFirstSubmissionPayment,
    reviewOpportunityLabels,
} from './review-opportunity.utils'

describe('reviewOpportunityLabels', () => {
    it('merges tags, technologies, and skills without duplicate chips', () => {
        const opportunity: ReviewOpportunity = {
            challengeData: {
                skills: ['TypeScript', { name: 'React' }],
                tags: ['Featured', 'TypeScript'],
                technologies: [{ name: 'React' }, 'Node.js'],
            },
            challengeId: 'challenge-id',
            id: 'review-id',
        }

        expect(reviewOpportunityLabels(opportunity))
            .toEqual(['Featured', 'TypeScript', 'React', 'Node.js'])
    })

    it('returns an empty array when the challenge snapshot has no chips', () => {
        expect(reviewOpportunityLabels({
            challengeId: 'challenge-id',
            id: 'review-id',
        }))
            .toEqual([])
    })
})

describe('reviewFirstSubmissionPayment', () => {
    it('adds the per-submission amount to the selected role base for the first review', () => {
        const opportunity: ReviewOpportunity = {
            basePayment: 1.43,
            challengeId: 'challenge-id',
            id: 'review-id',
            incrementalPayment: 0.55,
            payments: [
                { payment: 1.43, role: 'Reviewer', roleId: 1 },
                { payment: 2.5, role: 'Primary Reviewer', roleId: 2 },
            ],
        }

        expect(reviewFirstSubmissionPayment(opportunity))
            .toBeCloseTo(1.98)
        expect(reviewFirstSubmissionPayment(opportunity, 'PRIMARY_REVIEWER'))
            .toBeCloseTo(3.05)
    })

    it('retains per-review and missing-payment contracts', () => {
        expect(reviewFirstSubmissionPayment({
            basePayment: 0.23,
            challengeId: 'challenge-id',
            id: 'review-id',
            incrementalPayment: 0,
        }))
            .toBe(0.23)
        expect(reviewFirstSubmissionPayment({ challengeId: 'challenge-id', id: 'review-id' }))
            .toBeUndefined()
    })
})
