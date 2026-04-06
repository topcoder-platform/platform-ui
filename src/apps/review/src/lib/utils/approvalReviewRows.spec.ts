import type {
    BackendReview,
    BackendSubmission,
} from '../models'

import { buildApprovalReviewRows } from './approvalReviewRows'

jest.mock('~/libs/core', () => ({
    getRatingColor: () => '#2a2a2a',
}), { virtual: true })
jest.mock('~/config', () => ({
    EnvironmentConfig: {},
}), { virtual: true })

const createReview = (
    overrides: Partial<BackendReview> = {},
): BackendReview => ({
    committed: false,
    createdAt: '2026-02-23T08:33:44.000Z',
    createdBy: 'system',
    finalScore: 0,
    id: 'review-approval-2',
    initialScore: 0,
    legacyId: 'legacy-review-approval-2',
    legacySubmissionId: 'legacy-submission-2',
    metadata: {},
    phaseId: 'phase-approval-2',
    phaseName: 'Approval',
    resourceId: 'resource-approver-1',
    reviewDate: '',
    scorecardId: 'scorecard-approval',
    status: 'PENDING',
    submissionId: 'submission-2',
    typeId: '',
    updatedAt: '2026-02-23T08:33:44.000Z',
    updatedBy: 'system',
    ...overrides,
})

const createSubmission = (
    overrides: Partial<BackendSubmission> = {},
): BackendSubmission => ({
    challengeId: 'challenge-1',
    createdAt: '2026-02-23T08:33:44.000Z',
    createdBy: 'system',
    esId: 'es-submission-2',
    fileSize: 0,
    fileType: 'zip',
    finalScore: '0',
    id: 'submission-2',
    initialScore: '0',
    isFileSubmission: true,
    isLatest: true,
    legacyChallengeId: 1,
    legacySubmissionId: 'legacy-submission-2',
    legacyUploadId: 'legacy-upload-2',
    markForPurchase: false,
    memberId: 'member-2',
    placement: 0,
    prizeId: 0,
    review: [],
    reviewSummation: [],
    screeningScore: '',
    status: 1,
    submissionPhaseId: 'phase-submission',
    submittedDate: '2026-02-23T08:33:44.000Z',
    systemFileName: 'submission-2.zip',
    thurgoodJobId: '',
    type: 'CONTEST_SUBMISSION',
    updatedAt: '2026-02-23T08:33:44.000Z',
    updatedBy: 'system',
    uploadId: 'upload-2',
    url: 'https://example.com/submission-2.zip',
    userRank: 0,
    viewCount: 0,
    virusScan: true,
    ...overrides,
})

describe('buildApprovalReviewRows', () => {
    const approvalPhaseIds = new Set(['phase-approval-1', 'phase-approval-2'])
    const resourceMemberIdMapping = {
        'member-2': {
            challengeId: 'challenge-1',
            created: '2026-02-23T08:33:44.000Z',
            createdBy: 'system',
            id: 'resource-submitter-2',
            memberHandle: 'submitter-two',
            memberId: 'member-2',
            roleId: 'submitter-role',
            roleName: 'Submitter',
        },
    }

    it('falls back to submission-local approval reviews when challenge reviews are empty', () => {
        const submission = createSubmission({
            review: [createReview()],
        })

        const results = buildApprovalReviewRows({
            approvalPhaseIds,
            approvalScorecardId: 'scorecard-approval',
            challengeReviews: [],
            contestSubmissions: [submission],
            resourceMemberIdMapping,
            submissionsById: new Map([[submission.id, submission]]),
            submissionsByLegacyId: new Map([[submission.legacySubmissionId, submission]]),
        })

        expect(results)
            .toHaveLength(1)
        expect(results[0].id)
            .toBe('submission-2')
        expect(results[0].review?.id)
            .toBe('review-approval-2')
        expect(results[0].review?.phaseId)
            .toBe('phase-approval-2')
    })

    it('does not duplicate approval rows when the same review is present globally and on the submission', () => {
        const review = createReview()
        const submission = createSubmission({
            review: [review],
        })

        const results = buildApprovalReviewRows({
            approvalPhaseIds,
            approvalScorecardId: 'scorecard-approval',
            challengeReviews: [review],
            contestSubmissions: [submission],
            resourceMemberIdMapping,
            submissionsById: new Map([[submission.id, submission]]),
            submissionsByLegacyId: new Map([[submission.legacySubmissionId, submission]]),
        })

        expect(results)
            .toHaveLength(1)
        expect(results[0].review?.id)
            .toBe(review.id)
    })
})
