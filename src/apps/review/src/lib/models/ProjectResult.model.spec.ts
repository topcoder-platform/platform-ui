import type { BackendProjectResult } from './BackendProjectResult.model'
import { convertBackendProjectResultToProjectResult } from './ProjectResult.model'

jest.mock('~/libs/core', () => ({
    getRatingColor: jest.fn()
        .mockReturnValue('#000000'),
}), { virtual: true })

describe('convertBackendProjectResultToProjectResult', () => {
    it('preserves the canonical submission id and final-placement values', () => {
        const backendResult: BackendProjectResult = {
            challengeId: 'challenge-id',
            createdAt: '2026-01-05T00:00:00.000Z',
            createdBy: 'review-api',
            finalScore: 81,
            initialScore: 75,
            newRating: 1500,
            passedReview: true,
            paymentId: null, // eslint-disable-line unicorn/no-null
            placement: 1,
            pointAdjustment: null, // eslint-disable-line unicorn/no-null
            rated: false,
            ratingOrder: 1,
            submissionId: 'canonical-winning-submission',
            updatedAt: '2026-01-05T00:00:00.000Z',
            updatedBy: 'review-api',
            userId: '1001',
            validSubmission: true,
        }

        expect(convertBackendProjectResultToProjectResult(backendResult))
            .toMatchObject({
                challengeId: 'challenge-id',
                finalScore: 81,
                initialScore: 75,
                placement: 1,
                reviews: [],
                submissionId: 'canonical-winning-submission',
                userId: '1001',
            })
    })
})
