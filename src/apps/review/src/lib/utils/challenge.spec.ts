import { buildPhaseTabs, findPhaseByTabLabel, type PhaseLike } from './challenge'

const createPhase = (
    id: string,
    name: string,
    scheduledStartDate: string,
    overrides: Partial<PhaseLike> = {},
): PhaseLike => ({
    actualEndDate: overrides.actualEndDate ?? overrides.scheduledEndDate ?? scheduledStartDate,
    actualStartDate: overrides.actualStartDate ?? scheduledStartDate,
    duration: overrides.duration ?? 0,
    id,
    isOpen: overrides.isOpen ?? false,
    name,
    phaseId: overrides.phaseId ?? id,
    scheduledEndDate: overrides.scheduledEndDate ?? scheduledStartDate,
    scheduledStartDate,
})

describe('challenge phase tab helpers', () => {
    it('preserves the incoming phase order', () => {
        const phases: PhaseLike[] = [
            createPhase('1', 'Registration', '2025-01-01T00:00:00Z'),
            createPhase('2', 'Submission', '2025-01-02T00:00:00Z'),
            createPhase('3', 'Review', '2025-01-03T00:00:00Z'),
            createPhase('4', 'Appeals', '2025-01-04T00:00:00Z'),
            createPhase('5', 'Appeals Response', '2025-01-05T00:00:00Z'),
        ]

        const tabs = buildPhaseTabs(phases)
        expect(tabs.map(tab => tab.value))
            .toEqual([
                'Registration',
                'Submission',
                'Review',
                'Appeals',
                'Appeals Response',
            ])
    })

    it('places Registration before Submission when the start times match', () => {
        const phases: PhaseLike[] = [
            createPhase('a', 'Submission', '2025-01-01T00:00:00Z'),
            createPhase('b', 'Registration', '2025-01-01T00:00:00Z'),
            createPhase('c', 'Review', '2025-01-05T00:00:00Z'),
        ]

        const tabs = buildPhaseTabs(phases)
        expect(tabs.map(tab => tab.value))
            .toEqual([
                'Registration',
                'Submission',
                'Review',
            ])

        const registrationPhase = findPhaseByTabLabel(phases, 'Registration')
        const submissionPhase = findPhaseByTabLabel(phases, 'Submission')

        expect(registrationPhase?.id)
            .toBe('b')
        expect(submissionPhase?.id)
            .toBe('a')
    })

    it('places Registration before Checkpoint Screening when the start times match', () => {
        const phases: PhaseLike[] = [
            createPhase('a', 'Checkpoint Screening', '2025-01-01T00:00:00Z'),
            createPhase('b', 'Registration', '2025-01-01T00:00:00Z'),
            createPhase('c', 'Submission', '2025-01-02T00:00:00Z'),
        ]

        const tabs = buildPhaseTabs(phases)
        expect(tabs.map(tab => tab.value))
            .toEqual([
                'Registration',
                'Checkpoint Screening',
                'Submission',
            ])

        const registrationPhase = findPhaseByTabLabel(phases, 'Registration')
        const checkpointPhase = findPhaseByTabLabel(phases, 'Checkpoint Screening')

        expect(registrationPhase?.id)
            .toBe('b')
        expect(checkpointPhase?.id)
            .toBe('a')
    })

    it('places Registration before Checkpoint Submission when the start times match', () => {
        const phases: PhaseLike[] = [
            createPhase('a', 'Checkpoint Submission', '2025-01-01T00:00:00Z'),
            createPhase('b', 'Registration', '2025-01-01T00:00:00Z'),
            createPhase('c', 'Checkpoint Screening', '2025-01-01T00:10:00Z'),
        ]

        const tabs = buildPhaseTabs(phases)
        expect(tabs.map(tab => tab.value))
            .toEqual([
                'Registration',
                'Checkpoint Submission',
                'Checkpoint Screening',
            ])

        const registrationPhase = findPhaseByTabLabel(phases, 'Registration')
        const checkpointPhase = findPhaseByTabLabel(phases, 'Checkpoint Submission')

        expect(registrationPhase?.id)
            .toBe('b')
        expect(checkpointPhase?.id)
            .toBe('a')
    })

    it('keeps iterative review phases directly after submission for F2F challenges', () => {
        const phases: PhaseLike[] = [
            createPhase('1', 'Registration', '2025-01-01T00:00:00Z'),
            createPhase('2', 'Iterative Review 1', '2025-01-02T00:00:00Z'),
            createPhase('3', 'Submission', '2025-01-01T00:00:00Z'),
            createPhase('4', 'Iterative Review 2', '2025-01-03T00:00:00Z'),
            createPhase('5', 'Review', '2025-01-04T00:00:00Z'),
        ]

        const tabs = buildPhaseTabs(phases, undefined, { isF2F: true })
        expect(tabs.map(tab => tab.value))
            .toEqual([
                'Registration',
                'Submission',
                'Iterative Review 1',
                'Iterative Review 2',
                'Review',
            ])
    })

    it('ignores seconds when comparing phase start times', () => {
        const phases: PhaseLike[] = [
            createPhase('a', 'Checkpoint Screening', '2025-01-01T00:00:45Z'),
            createPhase('b', 'Registration', '2025-01-01T00:00:05Z'),
            createPhase('c', 'Submission', '2025-01-01T00:01:00Z'),
        ]

        const tabs = buildPhaseTabs(phases)
        expect(tabs.map(tab => tab.value))
            .toEqual([
                'Registration',
                'Checkpoint Screening',
                'Submission',
            ])

        const registrationPhase = findPhaseByTabLabel(phases, 'Registration')
        const checkpointPhase = findPhaseByTabLabel(phases, 'Checkpoint Screening')

        expect(registrationPhase?.id)
            .toBe('b')
        expect(checkpointPhase?.id)
            .toBe('a')
    })
})
