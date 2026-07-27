import type { SubmissionInfo } from '../models'

import { filterSubmissionRowsByOwnership } from './submissionOwnership'

/**
 * Builds a minimal submission row for ownership-filter regression tests.
 *
 * @param id - Submission identifier.
 * @param memberId - Challenge member that owns the submission.
 * @param overrides - Optional submission fields needed by a test case.
 * @returns A submission row containing the requested values.
 * @throws This test helper does not throw.
 */
const buildSubmission = (
    id: string,
    memberId: string,
    overrides: Partial<SubmissionInfo> = {},
): SubmissionInfo => ({
    id,
    memberId,
    ...overrides,
})

describe('filterSubmissionRowsByOwnership', () => {
    it('keeps all current-member submissions and excludes other winners and non-winners', () => {
        const ownPassing = buildSubmission('own-passing', 'member-current', {
            isPassingReview: true,
        })
        const ownFailed = buildSubmission('own-failed', 'member-current', {
            isPassingReview: false,
        })
        const otherWinner = buildSubmission('other-winner', 'member-winner', {
            placement: 1,
        })
        const otherNonWinner = buildSubmission('other-non-winner', 'member-other', {
            isPassingReview: false,
        })

        expect(filterSubmissionRowsByOwnership(
            [
                ownPassing,
                otherWinner,
                ownFailed,
                otherNonWinner,
            ],
            new Set(['member-current']),
        ))
            .toEqual([ownPassing, ownFailed])
    })

    it('uses known submission IDs when a legacy review row omits its member ID', () => {
        const directIdMatch = buildSubmission('owned-submission', '')
        const legacyIdMatch = buildSubmission('review-row', '', {
            legacySubmissionId: 'owned-legacy-submission',
        })
        const reviewIdMatch = buildSubmission('another-review-row', '', {
            review: {
                submissionId: 'owned-review-submission',
            },
        } as Partial<SubmissionInfo>)
        const unknownSubmission = buildSubmission('unknown-submission', '')

        expect(filterSubmissionRowsByOwnership(
            [
                directIdMatch,
                legacyIdMatch,
                reviewIdMatch,
                unknownSubmission,
            ],
            new Set(['member-current']),
            new Set([
                'owned-submission',
                'owned-legacy-submission',
                'owned-review-submission',
            ]),
        ))
            .toEqual([
                directIdMatch,
                legacyIdMatch,
                reviewIdMatch,
            ])
    })

    it('treats an explicit foreign member ID as authoritative', () => {
        const foreignRowWithOwnedId = buildSubmission(
            'owned-submission',
            'member-other',
        )

        expect(filterSubmissionRowsByOwnership(
            [foreignRowWithOwnedId],
            new Set(['member-current']),
            new Set(['owned-submission']),
        ))
            .toEqual([])
    })
})
