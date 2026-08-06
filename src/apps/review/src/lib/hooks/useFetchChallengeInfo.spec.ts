import type { BackendPhase, ChallengeInfo } from '../models'

import { getChallengeInfoRefreshInterval } from './useFetchChallengeInfo'

jest.mock('~/apps/admin/src/lib/utils', () => ({
    handleError: jest.fn(),
}), { virtual: true })

jest.mock('../services', () => ({
    fetchChallengeInfoById: jest.fn(),
}))

const checkpointReviewPhase: BackendPhase = {
    constraints: [],
    description: 'Select checkpoint winners',
    duration: 3_600,
    id: 'checkpoint-review-phase',
    isOpen: true,
    name: 'Checkpoint Review',
    phaseId: 'checkpoint-review-phase-type',
    scheduledEndDate: '2026-08-01T01:00:00.000Z',
    scheduledStartDate: '2026-08-01T00:00:00.000Z',
}

/**
 * Build the minimum challenge data needed to exercise refresh-interval selection.
 *
 * @param overrides challenge fields to replace for the current test case
 * @returns a complete ChallengeInfo fixture
 */
const buildChallengeInfo = (
    overrides: Partial<ChallengeInfo> = {},
): ChallengeInfo => ({
    checkpointWinners: [],
    currentPhase: 'Checkpoint Review',
    currentPhaseEndDate: '2026-08-01T01:00:00.000Z',
    id: 'challenge-1',
    name: 'Checkpoint challenge',
    phases: [checkpointReviewPhase],
    status: 'ACTIVE',
    submissions: [],
    track: {
        id: 'track-1',
        name: 'Design',
    },
    type: {
        id: 'type-1',
        name: 'Challenge',
    },
    typeId: 'type-1',
    ...overrides,
} as ChallengeInfo)

describe('getChallengeInfoRefreshInterval', () => {
    it('polls while an active Checkpoint Review can still be hiding winners', () => {
        expect(getChallengeInfoRefreshInterval(buildChallengeInfo()))
            .toBe(10_000)
    })

    it('stops polling after Checkpoint Review closes', () => {
        expect(getChallengeInfoRefreshInterval(buildChallengeInfo({
            currentPhase: 'Submission',
            phases: [{
                ...checkpointReviewPhase,
                isOpen: false,
            }],
        })))
            .toBe(0)
    })

    it('stops polling when checkpoint winners are already available', () => {
        expect(getChallengeInfoRefreshInterval(buildChallengeInfo({
            checkpointWinners: [{
                handle: 'winner',
                placement: 1,
                userId: 123,
            }],
        })))
            .toBe(0)
    })

    it('does not poll completed challenges or unrelated phases', () => {
        expect(getChallengeInfoRefreshInterval(buildChallengeInfo({ status: 'COMPLETED' })))
            .toBe(0)
        expect(getChallengeInfoRefreshInterval(buildChallengeInfo({
            currentPhase: 'Review',
            phases: [{
                ...checkpointReviewPhase,
                id: 'review-phase',
                name: 'Review',
                phaseId: 'review-phase-type',
            }],
        })))
            .toBe(0)
    })
})
