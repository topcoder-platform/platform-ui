import { Screening } from '../models'

import {
    isViewerAssignedToScreening,
    resolveViewerReviewId,
    resolveViewerReviewStatus,
} from './screeningAssignments'

const createScreeningRow = (overrides: Partial<Screening> = {}): Screening => ({
    challengeId: 'challenge-id',
    createdAt: '2025-12-08T18:00:00.000Z',
    memberId: 'member-id',
    result: '-',
    score: 'Pending',
    submissionId: 'submission-id',
    ...overrides,
})

describe('screeningAssignments', () => {
    describe('isViewerAssignedToScreening', () => {
        it('returns true when myReviewResourceId matches one of my resources', () => {
            const row = createScreeningRow({
                myReviewResourceId: 'resource-1',
                screenerId: 'resource-2',
            })
            const myResourceIds = new Set(['resource-1'])

            expect(isViewerAssignedToScreening(row, myResourceIds))
                .toBe(true)
        })

        it('falls back to screenerId when myReviewResourceId is missing', () => {
            const row = createScreeningRow({
                reviewId: 'review-1',
                screenerId: 'resource-2',
            })
            const myResourceIds = new Set(['resource-2'])

            expect(isViewerAssignedToScreening(row, myResourceIds))
                .toBe(true)
        })

        it('returns false when no assignment ids match my resources', () => {
            const row = createScreeningRow({
                myReviewResourceId: 'resource-1',
                screenerId: 'resource-2',
            })
            const myResourceIds = new Set(['resource-3'])

            expect(isViewerAssignedToScreening(row, myResourceIds))
                .toBe(false)
        })
    })

    describe('resolveViewerReviewId', () => {
        it('prefers myReviewId over reviewId', () => {
            const row = createScreeningRow({
                myReviewId: 'my-review-id',
                reviewId: 'review-id',
            })

            expect(resolveViewerReviewId(row))
                .toBe('my-review-id')
        })

        it('falls back to reviewId when myReviewId is unavailable', () => {
            const row = createScreeningRow({
                reviewId: 'review-id',
            })

            expect(resolveViewerReviewId(row))
                .toBe('review-id')
        })
    })

    describe('resolveViewerReviewStatus', () => {
        it('prefers myReviewStatus over reviewStatus and normalizes case', () => {
            const row = createScreeningRow({
                myReviewStatus: 'completed',
                reviewStatus: 'pending',
            })

            expect(resolveViewerReviewStatus(row))
                .toBe('COMPLETED')
        })

        it('falls back to reviewStatus when myReviewStatus is missing', () => {
            const row = createScreeningRow({
                reviewStatus: 'submitted',
            })

            expect(resolveViewerReviewStatus(row))
                .toBe('SUBMITTED')
        })
    })
})
