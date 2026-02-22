import type { BackendReview, BackendSubmission } from '../models'

import { selectBestReview } from './reviewSelection'

jest.mock('~/config', () => ({
    EnvironmentConfig: {},
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    getRatingColor: jest.fn()
        .mockReturnValue('#000000'),
}), { virtual: true })

const createReview = (
    id: string,
    overrides: Partial<BackendReview> = {},
): BackendReview => {
    const baseReview: BackendReview = {
        committed: false,
        createdAt: '2025-10-24T15:00:00.000Z',
        createdBy: 'tester',
        finalScore: Number.NaN,
        id,
        initialScore: Number.NaN,
        legacyId: `${id}-legacy`,
        legacySubmissionId: 'legacy-submission-1',
        metadata: '',
        phaseId: 'phase-screening',
        resourceId: `${id}-resource`,
        reviewDate: '',
        scorecardId: 'scorecard-screening',
        status: 'PENDING',
        submissionId: 'submission-1',
        typeId: '',
        updatedAt: '2025-10-24T15:00:00.000Z',
        updatedBy: 'tester',
    }

    return {
        ...baseReview,
        ...overrides,
    }
}

describe('selectBestReview', () => {
    it('prefers completed scored screening review over pending or in-progress alternatives', () => {
        const candidateReviews: BackendReview[] = [
            createReview('pending-no-score', {
                status: 'PENDING',
                updatedAt: '2025-10-24T15:10:00.000Z',
            }),
            createReview('in-progress-no-score', {
                status: 'IN_PROGRESS',
                updatedAt: '2025-10-24T15:20:00.000Z',
            }),
            createReview('completed-scored', {
                committed: true,
                finalScore: 87,
                status: 'COMPLETED',
                updatedAt: '2025-10-24T15:05:00.000Z',
            }),
        ]

        const result = selectBestReview(
            candidateReviews,
            'Screening',
            'scorecard-screening',
            new Set(['phase-screening']),
            {} as BackendSubmission,
        )

        expect(result?.id)
            .toBe('completed-scored')
    })
})
