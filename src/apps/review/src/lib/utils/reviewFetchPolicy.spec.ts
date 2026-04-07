import type { BackendResource } from '../models'

import { shouldForceChallengeReviewFetch } from './reviewFetchPolicy'

const createResource = (roleName: string): BackendResource => ({
    id: `${roleName}-resource`,
    memberId: '1001',
    roleId: `${roleName}-role`,
    roleName,
} as BackendResource)

describe('shouldForceChallengeReviewFetch', () => {
    it('forces review fetching for past challenges even when the viewer is only an observer', () => {
        expect(shouldForceChallengeReviewFetch(undefined, 'COMPLETED'))
            .toBe(true)
    })

    it('does not force review fetching for active observer views without privileged resources', () => {
        expect(shouldForceChallengeReviewFetch(undefined, 'ACTIVE', []))
            .toBe(false)
    })

    it('keeps forcing review fetching for submitter views', () => {
        expect(shouldForceChallengeReviewFetch('Submitter', 'ACTIVE', [createResource('Submitter')]))
            .toBe(true)
    })
})
