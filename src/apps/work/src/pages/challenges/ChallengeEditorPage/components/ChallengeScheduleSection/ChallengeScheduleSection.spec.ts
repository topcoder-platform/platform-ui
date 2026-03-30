import { ChallengePhase } from '../../../../../lib/models'

import {
    AI_SCREENING_PHASE_NAME,
    buildSchedulePhaseRows,
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

    describe('buildSchedulePhaseRows', () => {
        it('injects virtual AI screening rows after submission phases when AI reviewers are present', () => {
            const rows = buildSchedulePhaseRows([
                buildPhase({
                    name: 'Checkpoint Submission',
                    phaseId: 'checkpoint-submission',
                }),
                buildPhase({
                    name: 'Submission',
                    phaseId: 'submission',
                }),
            ], true)

            expect(rows.map(row => row.phase.name))
                .toEqual([
                    'Checkpoint Submission',
                    AI_SCREENING_PHASE_NAME,
                    'Submission',
                    AI_SCREENING_PHASE_NAME,
                ])
            expect(rows.filter(row => row.isVirtual))
                .toHaveLength(2)
        })

        it('does not inject a virtual AI screening row when a real one already exists', () => {
            const rows = buildSchedulePhaseRows([
                buildPhase({
                    name: 'Submission',
                    phaseId: 'submission',
                }),
                buildPhase({
                    name: AI_SCREENING_PHASE_NAME,
                    phaseId: 'ai-screening',
                }),
            ], true)

            expect(rows.filter(row => row.isVirtual))
                .toHaveLength(0)
        })
    })
})
