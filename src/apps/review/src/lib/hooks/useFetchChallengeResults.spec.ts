import type {
    BackendResource,
    ChallengeWinner,
    ProjectResult,
    ReviewResult,
    SubmissionInfo,
} from '../models'
import { getSubmissionFinalScoreCandidate } from '../utils/challengeResultSubmissions'
import { submissionMatchesWinner } from '../utils/winnerMatching'

import { buildCanonicalChallengeResults } from './useFetchChallengeResults'

jest.mock('~/libs/core', () => ({
    getRatingColor: jest.fn()
        .mockReturnValue('#000000'),
}), { virtual: true })

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        API: {
            V6: 'https://api.topcoder.test/v6',
        },
    },
}), { virtual: true })

jest.mock('~/libs/shared', () => ({
    handleError: jest.fn(),
}), { virtual: true })

jest.mock('../services', () => ({
    fetchAllChallengeReviews: jest.fn(),
    fetchAllProjectResults: jest.fn(),
    fetchAllSubmissions: jest.fn(),
}))

const buildWinner = (overrides: Partial<ChallengeWinner> = {}): ChallengeWinner => ({
    handle: 'winner-handle',
    placement: 1,
    userId: 1001,
    ...overrides,
})

const buildSubmission = (overrides: Partial<SubmissionInfo> = {}): SubmissionInfo => ({
    id: 'submission-1',
    memberId: '1001',
    placement: 1,
    reviews: [],
    submitterHandle: 'winner-handle',
    ...overrides,
})

/**
 * Creates a canonical project-result row for pure result-builder tests.
 *
 * @param overrides fields that differ from the default first-place result.
 * @returns A project result with a canonical submission identifier.
 */
const buildProjectResult = (overrides: Partial<ProjectResult> = {}): ProjectResult => ({
    challengeId: 'challenge-id',
    createdAt: '2026-01-05T00:00:00.000Z',
    finalScore: 81,
    initialScore: 75,
    placement: 1,
    reviews: [],
    submissionId: 'canonical-submission',
    userId: '1001',
    ...overrides,
})

/**
 * Creates a display review for exact-submission enrichment tests.
 *
 * @param overrides fields that differ from the default review.
 * @returns A review result associated by the test's submission map.
 */
const buildReview = (overrides: Partial<ReviewResult> = {}): ReviewResult => ({
    appeals: [],
    createdAt: '2026-01-04T00:00:00.000Z',
    resourceId: 'reviewer-resource',
    reviewerHandle: 'reviewer',
    reviewerHandleColor: '#000000',
    score: 81,
    ...overrides,
})

/**
 * Creates a challenge resource for winner display enrichment tests.
 *
 * @param overrides fields that differ from the default winner resource.
 * @returns A mapped challenge resource for member 1001.
 */
const buildResource = (overrides: Partial<BackendResource> = {}): BackendResource => ({
    challengeId: 'challenge-id',
    created: '2026-01-01T00:00:00.000Z',
    createdBy: 'tester',
    id: 'winner-resource',
    memberHandle: 'winner-handle',
    memberId: '1001',
    roleId: 'submitter-role',
    ...overrides,
})

describe('submissionMatchesWinner', () => {
    it('matches submissions by member id when the ids agree', () => {
        expect(submissionMatchesWinner(
            buildSubmission(),
            buildWinner(),
        ))
            .toBe(true)
    })

    it('falls back to the submitter handle for legacy winner records', () => {
        expect(submissionMatchesWinner(
            buildSubmission({
                memberId: '9999',
                placement: 4,
            }),
            buildWinner({
                userId: 2002,
            }),
        ))
            .toBe(true)
    })

    it('falls back to placement when member ids and handles do not line up', () => {
        expect(submissionMatchesWinner(
            buildSubmission({
                memberId: '9999',
                placement: 2,
                submitterHandle: 'captain-handle',
            }),
            buildWinner({
                handle: 'group-member',
                placement: 2,
                userId: 3003,
            }),
        ))
            .toBe(true)
    })
})

describe('getSubmissionFinalScoreCandidate', () => {
    it('uses final aggregate scores before review scores', () => {
        expect(getSubmissionFinalScoreCandidate(buildSubmission({
            aggregateScore: 96.01,
            finalAggregateScore: 95.81,
            review: {
                finalScore: 100,
            } as SubmissionInfo['review'],
        })))
            .toBe(95.81)
    })

    it('falls back to review final score instead of provisional aggregate scores', () => {
        expect(getSubmissionFinalScoreCandidate(buildSubmission({
            aggregateScore: 96.01,
            review: {
                finalScore: 100,
            } as SubmissionInfo['review'],
        })))
            .toBe(100)
    })
})

describe('buildCanonicalChallengeResults', () => {
    it('uses the exact canonical submission and ignores checkpoint and duplicate winner rows', () => {
        const exactReview = buildReview()
        const siblingReview = buildReview({
            id: 'sibling-review',
            score: 99,
        })
        const submittedDate = '2026-01-03T00:00:00.000Z'
        const resource = buildResource()

        const results = buildCanonicalChallengeResults({
            canonicalResults: [buildProjectResult({
                finalScore: 81,
                initialScore: 75,
                submissionId: 'canonical-submission',
                userId: ' 1001 ',
            })],
            challengeUuid: 'challenge-id',
            memberMapping: {
                1001: resource,
            },
            reviewsBySubmissionId: new Map([
                ['canonical-submission', [exactReview]],
                ['higher-scoring-sibling', [siblingReview]],
            ]),
            submissions: [
                buildSubmission({
                    aggregateScore: 99,
                    id: 'higher-scoring-sibling',
                    reviews: [siblingReview],
                    submittedDate: '2026-01-06T00:00:00.000Z',
                }),
                buildSubmission({
                    aggregateScore: 70,
                    id: 'canonical-submission',
                    reviews: [exactReview],
                    submittedDate,
                }),
            ],
            winners: [
                buildWinner({ type: 'CHECKPOINT' }),
                buildWinner({ type: 'PLACEMENT' }),
                buildWinner({ type: 'PLACEMENT' }),
            ],
        })

        expect(results)
            .toHaveLength(1)
        expect(results[0])
            .toMatchObject({
                finalScore: 81,
                initialScore: 75,
                placement: 1,
                submissionId: 'canonical-submission',
                userId: '1001',
                userInfo: resource,
            })
        expect(results[0].reviews)
            .toHaveLength(1)
        expect(results[0].reviews[0].score)
            .toBe(81)
        expect(results[0].submittedDate)
            .toEqual(new Date(submittedDate))
    })

    it('does not fall back to a sibling when the canonical result is absent or malformed', () => {
        const params = {
            challengeUuid: 'challenge-id',
            memberMapping: {},
            reviewsBySubmissionId: new Map<string, ReviewResult[]>(),
            submissions: [buildSubmission({
                aggregateScore: 99,
                id: 'higher-scoring-sibling',
            })],
            winners: [buildWinner({ type: 'PLACEMENT' })],
        }

        expect(buildCanonicalChallengeResults({
            ...params,
            canonicalResults: [],
        }))
            .toEqual([])
        expect(buildCanonicalChallengeResults({
            ...params,
            canonicalResults: [buildProjectResult({ submissionId: '   ' })],
        }))
            .toEqual([])
    })

    it('supports legacy placement winner type aliases', () => {
        const canonicalResults = [buildProjectResult()]
        const sharedParams = {
            canonicalResults,
            challengeUuid: 'challenge-id',
            memberMapping: {},
            reviewsBySubmissionId: new Map<string, ReviewResult[]>(),
            submissions: [],
        }

        expect(buildCanonicalChallengeResults({
            ...sharedParams,
            winners: [buildWinner({ type: undefined })],
        }))
            .toHaveLength(1)
        expect(buildCanonicalChallengeResults({
            ...sharedParams,
            winners: [buildWinner({ type: 'Contest Submission' })],
        }))
            .toHaveLength(1)
    })
})
