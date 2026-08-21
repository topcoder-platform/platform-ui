import type { BackendPhase, SubmissionInfo } from '../models'

import {
    isAiFailedReviewSubmission,
    isContestReviewPhaseSubmission,
    shouldIncludeInReviewPhase,
} from './reviewPhaseGuards'

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

const specificationReviewPhase: BackendPhase = {
    ...reviewPhase,
    id: 'phase-spec-review',
    name: 'Specification Review',
    phaseId: 'phase-spec-review',
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

    it('matches legacy specification review tabs when the phase name is requested explicitly', () => {
        const baseSubmission = buildSubmission('Contest Submission')

        expect(isContestReviewPhaseSubmission(
            {
                ...baseSubmission,
                review: {
                    ...(baseSubmission.review as NonNullable<SubmissionInfo['review']>),
                    phaseId: 'phase-spec-review',
                    phaseName: 'Specification Review',
                },
            },
            [reviewPhase, specificationReviewPhase],
            'Specification Review',
        ))
            .toBe(true)
    })

    it('does not mix specification review rows into the standard review tab', () => {
        const baseSubmission = buildSubmission('Contest Submission')

        expect(isContestReviewPhaseSubmission(
            {
                ...baseSubmission,
                review: {
                    ...(baseSubmission.review as NonNullable<SubmissionInfo['review']>),
                    phaseId: 'phase-spec-review',
                    phaseName: 'Specification Review',
                },
            },
            [reviewPhase, specificationReviewPhase],
            'Review',
        ))
            .toBe(false)
    })
})

describe('isAiFailedReviewSubmission', () => {
    it('detects AI-locked submissions regardless of status casing', () => {
        expect(isAiFailedReviewSubmission({ status: 'AI_FAILED_REVIEW' } as SubmissionInfo))
            .toBe(true)
        expect(isAiFailedReviewSubmission({ status: 'ai_failed_review' } as SubmissionInfo))
            .toBe(true)
    })

    it('ignores other submission statuses', () => {
        expect(isAiFailedReviewSubmission({ status: 'ACTIVE' } as SubmissionInfo))
            .toBe(false)
        expect(isAiFailedReviewSubmission(undefined))
            .toBe(false)
    })

    it('keeps AI-failed submissions visible even when the phase guard excludes them', () => {
        const aiFailedSubmission = {
            id: 'submission-ai-failed',
            memberId: '1001',
            status: 'AI_FAILED_REVIEW',
            type: 'Contest Submission',
        } as SubmissionInfo

        // No review-phase hints, so the phase guard alone would drop the row.
        expect(shouldIncludeInReviewPhase(aiFailedSubmission, [reviewPhase]))
            .toBe(false)
        expect(isAiFailedReviewSubmission(aiFailedSubmission))
            .toBe(true)
    })
})
