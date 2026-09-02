import { ReviewOpportunity } from '../models'

import { reviewOpportunityLabels } from './review-opportunity.utils'

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
