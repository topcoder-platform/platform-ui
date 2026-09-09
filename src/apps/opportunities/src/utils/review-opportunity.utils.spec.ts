import { ReviewOpportunity } from '../models'

import {
    reviewFirstSubmissionPayment,
    reviewOpportunityCanApply,
    reviewOpportunityIsFull,
    reviewOpportunityIsWaitlisted,
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

describe('review opportunity waitlist state', () => {
    it('treats an explicit zero remainder as filled capacity', () => {
        expect(reviewOpportunityIsFull({
            approvedApplicationCount: 2,
            challengeId: 'challenge-id',
            id: 'review-id',
            openPositions: 2,
            remainingPositions: 0,
        }))
            .toBe(true)
    })

    it('allows only capacity-rejected legacy responses to join the waitlist', () => {
        const fullOpportunity: ReviewOpportunity = {
            canApply: false,
            canApplyReason: 'NO_OPEN_POSITIONS',
            challengeId: 'challenge-id',
            id: 'review-id',
            remainingPositions: 0,
        }

        expect(reviewOpportunityCanApply(fullOpportunity))
            .toBe(true)
        expect(reviewOpportunityCanApply({
            ...fullOpportunity,
            canApplyReason: 'OPPORTUNITY_CLOSED',
        }))
            .toBe(false)
        expect(reviewOpportunityCanApply({
            ...fullOpportunity,
            canApplyReason: 'ALREADY_APPLIED',
        }))
            .toBe(false)
    })

    it('labels only a pending caller application as waitlisted while capacity is full', () => {
        const opportunity: ReviewOpportunity = {
            challengeId: 'challenge-id',
            id: 'review-id',
            myApplications: [{ status: 'PENDING' }],
            remainingPositions: 0,
        }

        expect(reviewOpportunityIsWaitlisted(opportunity))
            .toBe(true)
        expect(reviewOpportunityIsWaitlisted({
            ...opportunity,
            myApplications: [{ status: 'APPROVED' }],
        }))
            .toBe(false)
        expect(reviewOpportunityIsWaitlisted({
            ...opportunity,
            remainingPositions: 1,
        }))
            .toBe(false)
    })
})
