import { BackendSubmissionStatus } from './BackendSubmissionStatus.enum'
import type { BackendSubmission } from './BackendSubmission.model'
import { convertBackendSubmissionToSubmissionInfo } from './SubmissionInfo.model'

jest.mock('~/libs/core', () => ({
    getRatingColor: jest.fn()
        .mockReturnValue('#000000'),
}), { virtual: true })

/**
 * Builds a minimal backend submission for submission model conversion specs.
 *
 * @param overrides - Submission fields to override for a test case.
 * @returns Backend submission payload accepted by convertBackendSubmissionToSubmissionInfo.
 * Used to keep Marathon Match review summation selection tests focused.
 */
function buildBackendSubmission(overrides: Partial<BackendSubmission> = {}): BackendSubmission {
    return {
        challengeId: 'challenge-1',
        createdAt: '2026-06-05T05:00:00.000Z',
        createdBy: 'system',
        esId: 'es-1',
        fileSize: undefined,
        fileType: 'zip',
        finalScore: '',
        id: 'submission-1',
        initialScore: '',
        legacyChallengeId: 123,
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
        submissionPhaseId: 'phase-1',
        submittedDate: '2026-06-05T05:00:00.000Z',
        systemFileName: undefined,
        thurgoodJobId: undefined,
        type: 'CONTEST_SUBMISSION',
        updatedAt: '2026-06-05T05:00:00.000Z',
        updatedBy: 'system',
        uploadId: 'upload-1',
        url: '',
        userRank: 1,
        viewCount: undefined,
        ...overrides,
    } as unknown as BackendSubmission
}

describe('convertBackendSubmissionToSubmissionInfo', () => {
    it('uses metadata-only system summations as final aggregate scores', () => {
        const result = convertBackendSubmissionToSubmissionInfo(buildBackendSubmission({
            reviewSummation: [
                {
                    aggregateScore: 96.01,
                    isProvisional: true,
                    metadata: { testType: 'provisional' },
                    updatedAt: '2026-06-05T05:10:00.000Z',
                },
                {
                    aggregateScore: '100',
                    metadata: { testProcess: 'system' },
                    updatedAt: '2026-06-05T05:15:00.000Z',
                },
            ],
        }))

        expect(result.aggregateScore)
            .toBe(100)
        expect(result.finalAggregateScore)
            .toBe(100)
    })

    it('does not expose a provisional summation as a final aggregate score', () => {
        const result = convertBackendSubmissionToSubmissionInfo(buildBackendSubmission({
            reviewSummation: [
                {
                    aggregateScore: 96.01,
                    isProvisional: true,
                    metadata: { testType: 'provisional' },
                    updatedAt: '2026-06-05T05:10:00.000Z',
                },
            ],
        }))

        expect(result.aggregateScore)
            .toBe(96.01)
        expect(result.finalAggregateScore)
            .toBeUndefined()
    })
})
