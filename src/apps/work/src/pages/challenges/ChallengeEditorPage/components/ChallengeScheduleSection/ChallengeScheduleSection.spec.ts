import { ChallengePhase } from '../../../../../lib/models'

import {
    canEditPhaseStartDate,
    recalculatePhases,
} from './ChallengeScheduleSection.utils'

function buildPhase(overrides: Partial<ChallengePhase>): ChallengePhase {
    return {
        duration: 1,
        phaseId: 'phase-id',
        ...overrides,
    }
}

describe('ChallengeScheduleSection helpers', () => {
    describe('canEditPhaseStartDate', () => {
        it('allows editing Topgear submission phase start time', () => {
            const result = canEditPhaseStartDate(
                buildPhase({
                    name: 'Topgear Submission',
                }),
                1,
                false,
            )

            expect(result)
                .toBe(true)
        })
    })

    describe('recalculatePhases', () => {
        it('keeps existing start dates for root phases unless start date reset is requested', () => {
            const registrationStart = '2025-10-28T23:48:00.000Z'
            const topgearSubmissionStart = '2025-10-29T00:10:00.000Z'
            const phases: ChallengePhase[] = [
                buildPhase({
                    name: 'Registration',
                    phaseId: 'registration',
                    scheduledStartDate: registrationStart,
                }),
                buildPhase({
                    name: 'Topgear Submission',
                    phaseId: 'topgear-submission',
                    scheduledStartDate: topgearSubmissionStart,
                }),
                buildPhase({
                    duration: 1440,
                    name: 'Iterative Review',
                    phaseId: 'iterative-review',
                    predecessor: 'topgear-submission',
                    scheduledStartDate: topgearSubmissionStart,
                }),
            ]

            const result = recalculatePhases(phases, registrationStart)

            expect(result.phases[0]?.scheduledStartDate)
                .toBe(registrationStart)
            expect(result.phases[1]?.scheduledStartDate)
                .toBe(topgearSubmissionStart)
            expect(result.phases[2]?.scheduledStartDate)
                .toBe(topgearSubmissionStart)
        })

        it('resets root phase starts to challenge start date when requested', () => {
            const initialStartDate = '2025-10-28T23:48:00.000Z'
            const updatedStartDate = '2025-10-30T05:20:00.000Z'
            const phases: ChallengePhase[] = [
                buildPhase({
                    name: 'Registration',
                    phaseId: 'registration',
                    scheduledStartDate: initialStartDate,
                }),
                buildPhase({
                    name: 'Topgear Submission',
                    phaseId: 'topgear-submission',
                    scheduledStartDate: '2025-10-29T00:10:00.000Z',
                }),
                buildPhase({
                    duration: 1440,
                    name: 'Iterative Review',
                    phaseId: 'iterative-review',
                    predecessor: 'topgear-submission',
                    scheduledStartDate: '2025-10-29T00:10:00.000Z',
                }),
            ]

            const result = recalculatePhases(phases, updatedStartDate, {
                resetRootPhasesToStartDate: true,
            })

            expect(result.phases[0]?.scheduledStartDate)
                .toBe(updatedStartDate)
            expect(result.phases[1]?.scheduledStartDate)
                .toBe(updatedStartDate)
            expect(result.phases[2]?.scheduledStartDate)
                .toBe(updatedStartDate)
        })
    })
})
