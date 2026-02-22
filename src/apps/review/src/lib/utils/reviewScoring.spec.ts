import type { SubmissionInfo } from '../models'

import { hasRoleBasedThresholdAccess } from './reviewScoring'

jest.mock('~/libs/core', () => ({
    getRatingColor: jest.fn()
        .mockReturnValue('#000000'),
}), { virtual: true })

describe('hasRoleBasedThresholdAccess', () => {
    it('returns true for non-submitter views even when submitter review data is missing', () => {
        const canAccess = hasRoleBasedThresholdAccess(
            false,
            [],
            new Set(['reviewer-member-id']),
            75,
        )

        expect(canAccess)
            .toBe(true)
    })

    it('returns false for submitter views when the submitter has not passed the threshold', () => {
        const canAccess = hasRoleBasedThresholdAccess(
            true,
            [],
            new Set(['submitter-member-id']),
            75,
        )

        expect(canAccess)
            .toBe(false)
    })

    it('returns true for submitter views when an owned submission passes the threshold', () => {
        const submitterRows: SubmissionInfo[] = [
            {
                aggregateScore: 88,
                id: 'submission-id',
                memberId: 'submitter-member-id',
            },
        ]

        const canAccess = hasRoleBasedThresholdAccess(
            true,
            submitterRows,
            new Set(['submitter-member-id']),
            75,
        )

        expect(canAccess)
            .toBe(true)
    })
})
