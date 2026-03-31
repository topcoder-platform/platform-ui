import {
    BackendPhase,
    BackendResource,
    SubmissionInfo,
} from '../../models'

import { filterIterativeReviewRows } from './iterativeReviewFiltering'

const createPhase = (
    id: string,
    name: string,
    phaseId = id,
): BackendPhase => ({
    constraints: [],
    description: '',
    duration: 0,
    id,
    isOpen: false,
    name,
    phaseId,
    scheduledEndDate: '2026-03-30T00:00:00Z',
    scheduledStartDate: '2026-03-30T00:00:00Z',
})

const createResource = (
    id: string,
    roleName: string,
): BackendResource => ({
    challengeId: 'challenge-1',
    created: '2026-03-30T00:00:00Z',
    createdBy: 'system',
    id,
    memberHandle: `${id}-handle`,
    memberId: `${id}-member`,
    roleId: `${roleName}-role`,
    roleName,
})

const createSubmission = (
    resourceId: string,
    phaseId?: string,
): SubmissionInfo => ({
    id: `submission-${resourceId}`,
    memberId: 'submitter-1',
    review: {
        committed: false,
        createdAt: '',
        finalScore: 0,
        id: '',
        initialScore: 0,
        metadata: {},
        phaseId: phaseId ?? '',
        phaseName: '',
        resourceId,
        reviewDate: '',
        reviewItems: [],
        scorecardId: '',
        status: '',
        submissionId: `submission-${resourceId}`,
        submitterHandle: '',
        submitterMaxRating: undefined,
        updatedAt: '',
    },
})

describe('filterIterativeReviewRows', () => {
    const challengePhases: BackendPhase[] = [
        createPhase('submission-1', 'Submission'),
        createPhase('iterative-1', 'Iterative Review', 'iterative-phase-1'),
        createPhase('review-1', 'Review', 'review-phase-1'),
    ]

    it('keeps a phase-less iterative placeholder when a single iterative phase is selected', () => {
        const iterativeReviewer = createResource('iterative-resource-1', 'Iterative Reviewer')
        const results = filterIterativeReviewRows({
            challengePhases,
            isPostMortemPhase: false,
            phaseIdFilter: 'iterative-1',
            reviewerResources: [iterativeReviewer],
            sourceRows: [createSubmission(iterativeReviewer.id)],
        })

        expect(results)
            .toHaveLength(1)
        expect(results[0].id)
            .toBe(`submission-${iterativeReviewer.id}`)
    })

    it('does not show a phase-less standard reviewer placeholder on the iterative tab', () => {
        const standardReviewer = createResource('review-resource-1', 'Reviewer')
        const results = filterIterativeReviewRows({
            challengePhases,
            isPostMortemPhase: false,
            phaseIdFilter: 'iterative-1',
            reviewerResources: [standardReviewer],
            sourceRows: [createSubmission(standardReviewer.id)],
        })

        expect(results)
            .toEqual([])
    })

    it('still keeps explicit phase-id matches when the review exists', () => {
        const standardReviewer = createResource('review-resource-1', 'Reviewer')
        const results = filterIterativeReviewRows({
            challengePhases,
            isPostMortemPhase: false,
            phaseIdFilter: 'iterative-1',
            reviewerResources: [standardReviewer],
            sourceRows: [createSubmission(standardReviewer.id, 'iterative-phase-1')],
        })

        expect(results)
            .toHaveLength(1)
        expect(results[0].review?.phaseId)
            .toBe('iterative-phase-1')
    })

    it('limits completed F2F rows to the supplied winning submission ids', () => {
        const iterativeReviewer = createResource('iterative-resource-1', 'Iterative Reviewer')
        const losingReviewer = createResource('iterative-resource-2', 'Iterative Reviewer')
        const results = filterIterativeReviewRows({
            challengePhases,
            isPostMortemPhase: false,
            limitToSubmissionIds: [`submission-${iterativeReviewer.id}`],
            reviewerResources: [iterativeReviewer, losingReviewer],
            sourceRows: [
                {
                    ...createSubmission(iterativeReviewer.id),
                    memberId: 'winner-member',
                },
                {
                    ...createSubmission(losingReviewer.id),
                    memberId: 'losing-member',
                },
            ],
        })

        expect(results)
            .toHaveLength(1)
        expect(results[0].id)
            .toBe(`submission-${iterativeReviewer.id}`)
    })
})
