import type {
    BackendPhase,
    Screening,
    SubmissionInfo,
} from '../models'

import { calculateReviewProgress } from './reviewProgress'

jest.mock('~/config', () => ({
    EnvironmentConfig: {},
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    getRatingColor: jest.fn()
        .mockReturnValue('#000000'),
}), { virtual: true })

const createPhase = (name: string): BackendPhase => ({
    constraints: [],
    description: '',
    duration: 0,
    id: `${name.toLowerCase()}-id`,
    isOpen: true,
    name,
    phaseId: `${name.toLowerCase()}-id`,
    scheduledEndDate: '2025-01-01T01:00:00.000Z',
    scheduledStartDate: '2025-01-01T00:00:00.000Z',
})

const createReviewSubmission = (
    submissionId: string,
    status: string,
    overrides: Partial<SubmissionInfo> = {},
): SubmissionInfo => ({
    id: submissionId,
    isLatest: true,
    memberId: `member-${submissionId}`,
    review: {
        committed: status.toUpperCase() === 'COMPLETED',
        createdAt: '2025-01-01T00:00:00.000Z',
        id: `review-${submissionId}`,
        resourceId: 'reviewer-resource-id',
        reviewItems: [],
        scorecardId: 'scorecard-id',
        status,
        submissionId,
        updatedAt: '2025-01-01T00:00:00.000Z',
    },
    reviewTypeId: 'Review',
    ...overrides,
})

const createScreeningRow = (
    submissionId: string,
    result: Screening['result'],
): Screening => ({
    challengeId: 'challenge-id',
    createdAt: '2025-01-01T00:00:00.000Z',
    memberId: `member-${submissionId}`,
    result,
    score: '100',
    submissionId,
})

describe('calculateReviewProgress', () => {
    const reviewPhases = [
        createPhase('Screening'),
        createPhase('Review'),
    ]

    it('ignores screening-failed submissions when computing review phase progress', () => {
        const reviewRows: SubmissionInfo[] = [
            createReviewSubmission('failed-submission', 'PENDING'),
            createReviewSubmission('passed-submission', 'COMPLETED'),
        ]
        const screeningRows: Screening[] = [
            createScreeningRow('failed-submission', 'NO PASS'),
            createScreeningRow('passed-submission', 'PASS'),
        ]

        const progress = calculateReviewProgress({
            challengePhases: reviewPhases,
            isDesignChallenge: false,
            reviewRows,
            screeningRows,
        })

        expect(progress)
            .toBe(100)
    })

    it('uses only latest submissions for non-design challenges', () => {
        const reviewRows: SubmissionInfo[] = [
            createReviewSubmission('older-submission', 'COMPLETED', { isLatest: false }),
            createReviewSubmission('latest-submission', 'PENDING', { isLatest: true }),
        ]
        const screeningRows: Screening[] = [
            createScreeningRow('older-submission', 'PASS'),
            createScreeningRow('latest-submission', 'PASS'),
        ]

        const progress = calculateReviewProgress({
            challengePhases: reviewPhases,
            isDesignChallenge: false,
            reviewRows,
            screeningRows,
        })

        expect(progress)
            .toBe(0)
    })

    it('counts all submissions for design challenges', () => {
        const reviewRows: SubmissionInfo[] = [
            createReviewSubmission('older-submission', 'COMPLETED', { isLatest: false }),
            createReviewSubmission('latest-submission', 'PENDING', { isLatest: true }),
        ]
        const screeningRows: Screening[] = [
            createScreeningRow('older-submission', 'PASS'),
            createScreeningRow('latest-submission', 'PASS'),
        ]

        const progress = calculateReviewProgress({
            challengePhases: reviewPhases,
            isDesignChallenge: true,
            reviewRows,
            screeningRows,
        })

        expect(progress)
            .toBe(50)
    })
})
