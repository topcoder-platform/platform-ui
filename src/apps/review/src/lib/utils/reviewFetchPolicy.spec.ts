import type { BackendResource } from '../models'

import { shouldForceChallengeReviewFetch } from './reviewFetchPolicy'

const createResource = (roleName: string): BackendResource => ({
    id: `${roleName}-resource`,
    memberId: '1001',
    roleId: `${roleName}-role`,
    roleName,
} as BackendResource)

describe('shouldForceChallengeReviewFetch', () => {
    it('does not use past challenge status alone to fetch protected reviews', () => {
        expect(shouldForceChallengeReviewFetch(undefined, 'COMPLETED'))
            .toBe(false)
    })

    it('fails closed while challenge resource role names are unresolved', () => {
        expect(shouldForceChallengeReviewFetch(
            undefined,
            'COMPLETED',
            [{
                ...createResource('Submitter'),
                roleName: undefined,
            }],
            true,
        ))
            .toBe(false)
    })

    it('does not force review fetching for active observer views without privileged resources', () => {
        expect(shouldForceChallengeReviewFetch(undefined, 'ACTIVE', []))
            .toBe(false)
    })

    it('waits for challenge context before fetching for a privileged role', () => {
        expect(shouldForceChallengeReviewFetch(
            'Reviewer',
            undefined,
            [createResource('Reviewer')],
        ))
            .toBe(false)
    })

    it('keeps forcing review fetching for submitter views', () => {
        expect(shouldForceChallengeReviewFetch(
            'Submitter',
            'ACTIVE',
            [createResource('Submitter')],
            true,
        ))
            .toBe(true)
    })

    it('does not fetch reviews for a completed registered-only submitter', () => {
        expect(shouldForceChallengeReviewFetch(
            'Submitter',
            'COMPLETED',
            [createResource('Submitter')],
            false,
        ))
            .toBe(false)
    })

    it('retains completed review access for a submitter with a visible submission', () => {
        expect(shouldForceChallengeReviewFetch(
            'Submitter',
            'COMPLETED',
            [createResource('Submitter')],
            true,
        ))
            .toBe(true)
    })

    it('retains review access for an assigned Task submitter without a submission', () => {
        expect(shouldForceChallengeReviewFetch(
            'Submitter',
            'COMPLETED',
            [createResource('Submitter')],
            false,
            true,
        ))
            .toBe(true)
    })

    it('retains past review access for privileged viewers without visible submissions', () => {
        expect(shouldForceChallengeReviewFetch(
            'Copilot',
            'COMPLETED',
            [createResource('Copilot')],
            false,
        ))
            .toBe(true)
    })
})
