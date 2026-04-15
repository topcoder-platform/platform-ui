import type { BackendReview, BackendSubmission } from '../models'
import { BackendSubmissionStatus } from '../models/BackendSubmissionStatus.enum'

import { buildSubmitterReviewSubmission } from './submitterReviewResolution'

jest.mock('~/libs/core', () => ({
    getRatingColor: jest.fn()
        .mockReturnValue('#000000'),
}), { virtual: true })

const buildReview = (overrides: Partial<BackendReview> = {}): BackendReview => ({
    createdAt: '2026-01-01T00:00:00.000Z',
    createdBy: 'tester',
    finalScore: 90,
    id: 'review-1',
    initialScore: 90,
    legacyId: 'legacy-review-1',
    legacySubmissionId: 'legacy-submission-1',
    metadata: '',
    phaseId: 'phase-review',
    phaseName: 'Review',
    resourceId: 'reviewer-resource-1',
    reviewDate: '2026-01-01T00:00:00.000Z',
    scorecardId: 'scorecard-review',
    status: 'COMPLETED',
    submissionId: 'submission-1',
    typeId: 'Review',
    updatedAt: '2026-01-01T00:00:00.000Z',
    updatedBy: 'tester',
    ...overrides,
} as BackendReview)

const buildSubmission = (overrides: Partial<BackendSubmission> = {}): BackendSubmission => ({
    challengeId: 'challenge-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    createdBy: 'tester',
    esId: 'es-submission-1',
    fileSize: undefined,
    fileType: 'zip',
    finalScore: '90',
    id: 'submission-1',
    initialScore: '90',
    isFileSubmission: true,
    isLatest: true,
    legacyChallengeId: 1,
    legacySubmissionId: 'legacy-submission-1',
    legacyUploadId: 'legacy-upload-1',
    markForPurchase: false,
    memberId: '1001',
    placement: 1,
    prizeId: 1,
    review: [],
    reviewSummation: [],
    screeningScore: undefined,
    status: BackendSubmissionStatus.ACTIVE,
    submissionPhaseId: 'phase-submission',
    submittedDate: '2026-01-01T00:00:00.000Z',
    systemFileName: 'submission.zip',
    thurgoodJobId: undefined,
    type: 'CONTEST_SUBMISSION',
    updatedAt: '2026-01-01T00:00:00.000Z',
    updatedBy: 'tester',
    uploadId: 'upload-1',
    url: 'https://example.com/submission.zip',
    userRank: 1,
    viewCount: undefined,
    virusScan: true,
    ...overrides,
} as BackendSubmission)

describe('buildSubmitterReviewSubmission', () => {
    it('builds a fallback submitter review row when legacy reviews cannot be resolved to a submission', () => {
        const result = buildSubmitterReviewSubmission({
            defaultId: 'fallback-review-row',
            resourceMemberIdMapping: {},
            review: buildReview({
                submissionId: '',
            }),
        })

        expect(result)
            .toMatchObject({
                id: 'legacy-submission-1',
                memberId: '',
                reviewTypeId: 'Review',
            })
        expect(result?.reviews)
            .toHaveLength(1)
    })

    it('still rejects checkpoint submissions when a resolved submission is not contest-based', () => {
        const result = buildSubmitterReviewSubmission({
            defaultId: 'fallback-review-row',
            matchingSubmission: buildSubmission({
                type: 'CHECKPOINT_SUBMISSION',
            }),
            resourceMemberIdMapping: {},
            review: buildReview(),
        })

        expect(result)
            .toBeUndefined()
    })
})
