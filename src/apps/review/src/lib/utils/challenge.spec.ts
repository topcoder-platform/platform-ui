import type { BackendPhase } from '../models'

import {
    buildPhaseTabs,
    collectReopenEligiblePhaseIds,
    findPhaseByTabLabel,
    hasPendingApprovalReview,
    isFirst2FinishChallenge,
    type PhaseLike,
    resolveFirst2FinishIterativeSubmissionIds,
    shouldAllowWinnersTabForPastChallenge,
    shouldForceWinnersTabForPastChallenge,
} from './challenge'

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

const createBackendPhase = (
    id: string,
    name: string,
    scheduledStartDate: string,
    overrides: Partial<BackendPhase> = {},
): BackendPhase => ({
    actualEndDate: overrides.actualEndDate ?? overrides.scheduledEndDate ?? scheduledStartDate,
    actualStartDate: overrides.actualStartDate ?? scheduledStartDate,
    constraints: overrides.constraints ?? [],
    description: overrides.description ?? '',
    duration: overrides.duration ?? 0,
    id,
    isOpen: overrides.isOpen ?? false,
    name,
    phaseId: overrides.phaseId ?? id,
    predecessor: overrides.predecessor,
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

    it('adds winners tab for completed challenges when all phases are closed', () => {
        const phases: PhaseLike[] = [
            createPhase('1', 'Registration', '2025-01-01T00:00:00Z'),
            createPhase('2', 'Approval', '2025-01-02T00:00:00Z'),
        ]

        const tabs = buildPhaseTabs(phases, 'COMPLETED')
        expect(tabs.map(tab => tab.value))
            .toEqual([
                'Registration',
                'Approval',
                'Winners',
            ])
    })

    it('does not add winners tab for completed challenges that still have an open phase', () => {
        const phases: PhaseLike[] = [
            createPhase('1', 'Registration', '2025-01-01T00:00:00Z'),
            createPhase('2', 'Approval', '2025-01-02T00:00:00Z'),
            createPhase('3', 'Approval', '2025-01-03T00:00:00Z', { isOpen: true }),
        ]

        const tabs = buildPhaseTabs(phases, 'COMPLETED')
        expect(tabs.map(tab => tab.value))
            .toEqual([
                'Registration',
                'Approval',
                'Approval 2',
            ])
    })

    it('allows past challenges with winner data to force-show the winners tab', () => {
        expect(shouldForceWinnersTabForPastChallenge({
            status: 'COMPLETED',
            winners: [{ handle: 'winner-one', placement: 1, userId: 1 }],
        }))
            .toBe(true)
        expect(shouldForceWinnersTabForPastChallenge({
            status: 'COMPLETED',
            winners: [],
        }))
            .toBe(false)
    })

    it('force-shows winners for past challenges with winners even when a phase remains open', () => {
        expect(shouldAllowWinnersTabForPastChallenge({
            status: 'COMPLETED',
            phases: [
                createBackendPhase('iterative-1', 'Iterative Review', '2026-04-20T00:00:00Z', {
                    isOpen: true,
                }),
            ],
        }))
            .toBe(false)

        expect(shouldForceWinnersTabForPastChallenge({
            status: 'COMPLETED',
            phases: [
                createBackendPhase('iterative-1', 'Iterative Review', '2026-04-20T00:00:00Z', {
                    isOpen: true,
                }),
            ],
            winners: [{ handle: 'winner-one', placement: 1, userId: 1 }],
        }))
            .toBe(true)
    })

    it('keeps winners hidden when a follow-up approval review is still pending', () => {
        const challengeInfo = {
            phases: [
                createBackendPhase('approval-1', 'Approval', '2025-01-02T00:00:00Z'),
                createBackendPhase('approval-2', 'Approval', '2025-01-03T00:00:00Z'),
            ],
            status: 'COMPLETED',
            winners: [{ handle: 'winner-one', placement: 1, userId: 1 }],
        }
        const approvalReviews = [
            {
                review: {
                    status: 'PENDING',
                },
            },
        ]

        expect(hasPendingApprovalReview(approvalReviews))
            .toBe(true)
        expect(shouldAllowWinnersTabForPastChallenge(challengeInfo, approvalReviews))
            .toBe(false)
        expect(shouldForceWinnersTabForPastChallenge(challengeInfo, approvalReviews))
            .toBe(false)
    })

    it('recognizes First2Finish challenges when the type name contains digits', () => {
        expect(isFirst2FinishChallenge({
            track: {
                name: 'Development',
            } as never,
            type: {
                name: 'First2Finish',
            } as never,
        }))
            .toBe(true)
    })

    it('keeps only the first dated contest submission for F2F iterative review', () => {
        expect(resolveFirst2FinishIterativeSubmissionIds([
            {
                id: 'submission-2',
                placement: undefined as unknown as number,
                submittedDate: '2026-04-01T04:57:36.849Z',
            },
            {
                id: 'submission-1',
                placement: undefined as unknown as number,
                submittedDate: '2026-04-01T04:56:13.405Z',
            },
        ]))
            .toEqual(['submission-1'])
    })

    it('falls back to placement when F2F submission dates are unavailable', () => {
        expect(resolveFirst2FinishIterativeSubmissionIds([
            {
                id: 'submission-2',
                placement: 2,
                submittedDate: '',
            },
            {
                id: 'submission-1',
                placement: 1,
                submittedDate: '',
            },
        ]))
            .toEqual(['submission-1'])
    })
})

describe('collectReopenEligiblePhaseIds', () => {
    it('does not mark Registration as reopen-eligible in a two-round flow when Submission is open', () => {
        const phases: BackendPhase[] = [
            createBackendPhase('registration-id', 'Registration', '2025-12-05T10:55:00Z', {
                phaseId: 'registration-phase-id',
            }),
            createBackendPhase('checkpoint-submission-id', 'Checkpoint Submission', '2025-12-05T10:57:00Z', {
                phaseId: 'checkpoint-submission-phase-id',
                predecessor: 'registration-phase-id',
            }),
            createBackendPhase('checkpoint-screening-id', 'Checkpoint Screening', '2025-12-05T11:03:00Z', {
                phaseId: 'checkpoint-screening-phase-id',
                predecessor: 'checkpoint-submission-phase-id',
            }),
            createBackendPhase('checkpoint-review-id', 'Checkpoint Review', '2025-12-05T11:05:00Z', {
                phaseId: 'checkpoint-review-phase-id',
                predecessor: 'checkpoint-screening-phase-id',
            }),
            createBackendPhase('submission-id', 'Submission', '2025-12-05T11:09:00Z', {
                isOpen: true,
                phaseId: 'submission-phase-id',
                predecessor: 'checkpoint-review-phase-id',
            }),
        ]

        const eligible = collectReopenEligiblePhaseIds(phases)

        expect(eligible.has('checkpoint-review-id'))
            .toBe(true)
        expect(eligible.has('checkpoint-review-phase-id'))
            .toBe(true)
        expect(eligible.has('registration-id'))
            .toBe(false)
        expect(eligible.has('registration-phase-id'))
            .toBe(false)
    })

    it('marks Registration as reopen-eligible when it is the direct predecessor of an open phase', () => {
        const phases: BackendPhase[] = [
            createBackendPhase('registration-id', 'Registration', '2025-12-05T10:55:00Z', {
                phaseId: 'registration-phase-id',
            }),
            createBackendPhase('submission-id', 'Submission', '2025-12-05T11:09:00Z', {
                isOpen: true,
                phaseId: 'submission-phase-id',
                predecessor: 'registration-phase-id',
            }),
        ]

        const eligible = collectReopenEligiblePhaseIds(phases)

        expect(eligible.has('registration-id'))
            .toBe(true)
        expect(eligible.has('registration-phase-id'))
            .toBe(true)
    })
})
