import type { BackendReview, BackendSubmission } from '../models'

import {
    resolveSubmissionForReview,
    reviewMatchesSubmission,
} from './submissionResolution'

const submission = {
    id: 'submission-1',
    legacySubmissionId: 'legacy-submission-1',
} as unknown as BackendSubmission

describe('submissionResolution', () => {
    it('resolves submissions when legacy ids are returned through submissionId', () => {
        expect(resolveSubmissionForReview({
            review: {
                legacySubmissionId: '',
                submissionId: 'legacy-submission-1',
            } as unknown as BackendReview,
            submissionsById: new Map([[submission.id, submission]]),
            submissionsByLegacyId: new Map([[submission.legacySubmissionId, submission]]),
        }))
            .toBe(submission)
    })

    it('matches reviews and submissions across modern and legacy identifiers', () => {
        expect(reviewMatchesSubmission({
            review: {
                legacySubmissionId: '',
                submissionId: 'legacy-submission-1',
            } as unknown as BackendReview,
            submission,
        }))
            .toBe(true)
    })
})
