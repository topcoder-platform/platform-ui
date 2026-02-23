import type {
    BackendResource,
    MappingReviewAppeal,
    ReviewResult,
    SubmissionInfo,
} from '../models'

import { aggregateSubmissionReviews } from './aggregateSubmissionReviews'

jest.mock('~/libs/core', () => ({
    getRatingColor: jest.fn()
        .mockReturnValue('#2a2a2a'),
}), { virtual: true })

const createReviewer = (
    id: string,
    memberId: string,
    memberHandle: string,
): BackendResource => ({
    challengeId: 'challenge-1',
    created: '2026-01-01T00:00:00.000Z',
    createdBy: 'tester',
    id,
    memberHandle,
    memberId,
    roleId: 'reviewer-role',
})

const createReviewResult = (
    id: string,
    resourceId: string,
    reviewerHandle: string,
    score: number,
): ReviewResult => ({
    appeals: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    id,
    resourceId,
    reviewerHandle,
    reviewerHandleColor: '#2a2a2a',
    score,
})

const createSubmission = (
    id: string,
    reviews: ReviewResult[],
): SubmissionInfo => ({
    id,
    memberId: 'submitter-1',
    reviews,
})

describe('aggregateSubmissionReviews', () => {
    it('collapses duplicate reviewer identities that use different resource ids', () => {
        const reviewers: BackendResource[] = [
            createReviewer('alice-resource-1', 'alice-member', 'alice'),
            createReviewer('bob-resource-1', 'bob-member', 'bob'),
            createReviewer('alice-resource-2', 'alice-member', 'alice'),
            createReviewer('bob-resource-2', 'bob-member', 'bob'),
        ]

        const submissions: SubmissionInfo[] = [
            createSubmission('submission-1', [
                createReviewResult('review-1-alice', 'alice-resource-1', 'alice', 90),
                createReviewResult('review-1-bob', 'bob-resource-1', 'bob', 80),
            ]),
            createSubmission('submission-2', [
                createReviewResult('review-2-alice', 'alice-resource-2', 'alice', 70),
                createReviewResult('review-2-bob', 'bob-resource-2', 'bob', 60),
            ]),
        ]

        const rows = aggregateSubmissionReviews({
            mappingReviewAppeal: {} as MappingReviewAppeal,
            reviewers,
            submissions,
        })

        expect(rows)
            .toHaveLength(2)
        expect(rows[0].reviews)
            .toHaveLength(2)
        expect(rows[1].reviews)
            .toHaveLength(2)

        const firstRowScores = new Map(
            rows[0].reviews.map(review => [review.reviewerHandle, review.finalScore]),
        )
        expect(firstRowScores.get('alice'))
            .toBe(90)
        expect(firstRowScores.get('bob'))
            .toBe(80)

        const secondRowScores = new Map(
            rows[1].reviews.map(review => [review.reviewerHandle, review.finalScore]),
        )
        expect(secondRowScores.get('alice'))
            .toBe(70)
        expect(secondRowScores.get('bob'))
            .toBe(60)
    })
})
