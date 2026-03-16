import {
    Challenge,
    Resource,
    Review,
    Submission,
} from '../models'

import { canDeleteResource } from './resource-deletion.utils'

jest.mock('~/config', () => ({
    EnvironmentConfig: new Proxy({}, {
        get: (): string => 'https://www.topcoder-dev.com',
    }),
}), { virtual: true })

const baseChallenge: Challenge = {
    id: 'challenge-1',
    name: 'Reviewer deletion test',
    phases: [
        {
            isOpen: true,
            name: 'Review',
        },
    ],
    status: 'ACTIVE',
}

const baseReviewerResource: Resource = {
    challengeId: 'challenge-1',
    id: 'resource-1',
    memberHandle: 'reviewer1',
    memberId: '123',
    role: 'Reviewer',
    roleId: 'reviewer-role-id',
}

describe('canDeleteResource', () => {
    it('allows deleting a reviewer with only pending reviews', () => {
        const reviews: Review[] = [
            {
                committed: false,
                id: 'review-1',
                resourceId: 'resource-1',
                status: 'PENDING',
            },
        ]

        expect(canDeleteResource(
            baseReviewerResource,
            baseChallenge,
            [] as Submission[],
            reviews,
        ))
            .toBe(true)
    })

    it('blocks deleting a reviewer with an in-progress review', () => {
        const reviews: Review[] = [
            {
                committed: false,
                id: 'review-1',
                resourceId: 'resource-1',
                status: 'IN_PROGRESS',
            },
        ]

        expect(canDeleteResource(
            baseReviewerResource,
            baseChallenge,
            [] as Submission[],
            reviews,
        ))
            .toBe(false)
    })
})
