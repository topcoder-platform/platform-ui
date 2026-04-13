import type {
    Resource,
    ResourceRole,
    Reviewer,
} from '../../../../../lib/models'

import {
    buildAssignedResourcesByReviewer,
} from './reviewerAssignments.utils'

describe('buildAssignedResourcesByReviewer', () => {
    it('continues into the generic reviewer pool when a specific role runs out of resources', () => {
        const resourceRoles: ResourceRole[] = [
            {
                id: 'role-approver',
                name: 'Approver',
            },
            {
                id: 'role-reviewer',
                name: 'Reviewer',
            },
        ]
        const resources: Resource[] = [
            {
                challengeId: 'challenge-1',
                memberHandle: 'approver-one',
                roleId: 'role-approver',
            },
            {
                challengeId: 'challenge-1',
                memberHandle: 'approver-two',
                roleId: 'role-reviewer',
            },
            {
                challengeId: 'challenge-1',
                memberHandle: 'approver-three',
                roleId: 'role-reviewer',
            },
        ]
        const reviewers: Reviewer[] = [
            {
                memberReviewerCount: 2,
                phaseId: 'phase-approval',
            },
            {
                memberReviewerCount: 1,
                phaseId: 'phase-approval',
            },
        ]
        const assignedResourcesByReviewer = buildAssignedResourcesByReviewer({
            getReviewerCount: reviewer => Number(reviewer.memberReviewerCount || 1),
            phaseNameById: new Map([
                [
                    'phase-approval',
                    'Approval',
                ],
            ]),
            resourceRoles,
            resources,
            reviewers,
        })

        expect(assignedResourcesByReviewer.map(assignedResources => assignedResources
            .map(resource => resource.memberHandle)))
            .toEqual([
                [
                    'approver-one',
                    'approver-two',
                ],
                ['approver-three'],
            ])
    })
})
