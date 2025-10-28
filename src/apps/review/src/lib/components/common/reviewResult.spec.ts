import type { ReviewInfo } from '../../models/ReviewInfo.model'

import type { AggregatedReviewDetail, SubmissionRow } from './types'
import { resolveSubmissionReviewResult } from './reviewResult'

const DEFAULT_PASSING_SCORE = 80

const buildSubmission = (
    reviews: AggregatedReviewDetail[],
    averageFinalScore?: number,
): SubmissionRow => {
    const submissionInfo = {
        id: 'submission-1',
        memberId: 'member-1',
    }

    return {
        ...submissionInfo,
        aggregated: {
            averageFinalScore,
            id: submissionInfo.id,
            reviews: reviews.map(review => ({ ...review })),
            submission: submissionInfo,
        },
    }
}

const buildReviewInfo = (
    overrides: Partial<ReviewInfo> = {},
): ReviewInfo => ({
    committed: true,
    createdAt: new Date()
        .toISOString(),
    resourceId: overrides.resourceId ?? 'res-1',
    reviewItems: [],
    scorecardId: overrides.scorecardId ?? 'scorecard-1',
    updatedAt: new Date()
        .toISOString(),
    ...overrides,
})

describe('resolveSubmissionReviewResult', () => {
    it('returns undefined when any reviewer is still pending in a multi-review setup', () => {
        const submission = buildSubmission([
            {
                finalScore: 92,
                resourceId: 'res-1',
                status: 'COMPLETED',
            },
            {
                resourceId: 'res-2',
            },
        ], 92)

        const result = resolveSubmissionReviewResult(submission, {
            defaultMinimumPassingScore: DEFAULT_PASSING_SCORE,
        })

        expect(result)
            .toBeUndefined()
    })

    it('returns PASS once all reviewers have completed their assessments', () => {
        const submission = buildSubmission([
            {
                finalScore: 88,
                resourceId: 'res-1',
                status: 'COMPLETED',
            },
            {
                finalScore: 84,
                resourceId: 'res-2',
                status: 'SUBMITTED',
            },
        ], 86)

        const result = resolveSubmissionReviewResult(submission, {
            defaultMinimumPassingScore: DEFAULT_PASSING_SCORE,
        })

        expect(result)
            .toBe('PASS')
    })

    it('considers reviews complete when final scores exist even without explicit statuses', () => {
        const submission = buildSubmission([
            {
                finalScore: 90,
                resourceId: 'res-1',
            },
            {
                finalScore: 82,
                resourceId: 'res-2',
            },
        ], 86)

        const result = resolveSubmissionReviewResult(submission, {
            defaultMinimumPassingScore: DEFAULT_PASSING_SCORE,
        })

        expect(result)
            .toBe('PASS')
    })

    it('does not defer outcomes for single-review assignments', () => {
        const submission = buildSubmission([
            {
                finalScore: 91,
                resourceId: 'res-1',
                status: 'PENDING',
            },
        ], 91)

        const result = resolveSubmissionReviewResult(submission, {
            defaultMinimumPassingScore: DEFAULT_PASSING_SCORE,
        })

        expect(result)
            .toBe('PASS')
    })

    it('returns FAIL when metadata outcome is fail even if score passes threshold', () => {
        const submission = buildSubmission([
            {
                finalScore: 92,
                resourceId: 'res-1',
                reviewInfo: buildReviewInfo({
                    metadata: {
                        minimumScore: 1,
                        outcome: 'fail',
                    },
                }),
                status: 'COMPLETED',
            },
        ], 92)

        const result = resolveSubmissionReviewResult(submission, {
            defaultMinimumPassingScore: DEFAULT_PASSING_SCORE,
        })

        expect(result)
            .toBe('FAIL')
    })

    it('returns PASS when metadata outcome is pass even if score fails threshold', () => {
        const submission = buildSubmission([
            {
                finalScore: 40,
                resourceId: 'res-1',
                reviewInfo: buildReviewInfo({
                    metadata: {
                        minimumScore: 100,
                        outcome: 'pass',
                    },
                }),
                status: 'COMPLETED',
            },
        ], 40)

        const result = resolveSubmissionReviewResult(submission, {
            defaultMinimumPassingScore: DEFAULT_PASSING_SCORE,
        })

        expect(result)
            .toBe('PASS')
    })
})
