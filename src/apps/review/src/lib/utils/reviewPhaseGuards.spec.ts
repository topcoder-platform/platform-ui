import type { BackendPhase, SubmissionInfo } from '../models'

import { isContestReviewPhaseSubmission } from './reviewPhaseGuards'

const reviewPhase: BackendPhase = {
    constraints: [],
    description: '',
    duration: 0,
    id: 'phase-review',
    isOpen: false,
    name: 'Review',
    phaseId: 'phase-review',
    scheduledEndDate: '2026-01-02T00:00:00.000Z',
    scheduledStartDate: '2026-01-01T00:00:00.000Z',
}

const buildSubmission = (type: string): SubmissionInfo => ({
    id: 'submission-1',
    memberId: '1001',
    review: {
        committed: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'review-1',
        phaseId: 'phase-review',
        phaseName: 'Review',
        resourceId: 'reviewer-1',
        reviewItems: [],
        scorecardId: 'scorecard-1',
        status: 'COMPLETED',
        submissionId: 'submission-1',
        updatedAt: '2026-01-01T00:00:00.000Z',
    },
    type,
})

describe('isContestReviewPhaseSubmission', () => {
    it('accepts contest submission type values using legacy spacing/casing', () => {
        expect(isContestReviewPhaseSubmission(
            buildSubmission('Contest Submission'),
            [reviewPhase],
        ))
            .toBe(true)
    })

    it('rejects non-contest submission types', () => {
        expect(isContestReviewPhaseSubmission(
            buildSubmission('Checkpoint Submission'),
            [reviewPhase],
        ))
            .toBe(false)
    })
})
