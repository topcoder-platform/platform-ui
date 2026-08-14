import {
    challengeCatalogKey,
    challengeCatalogName,
    challengeCurrentPhase,
    challengePhaseTiming,
    challengePlacementPrizes,
    challengeRegistrationIsOpen,
    challengeSubmissionIsOpen,
    challengeTotalPrize,
    formatChallengeTimeLeft,
} from './challenge-card.utils'

describe('challenge card data utilities', () => {
    it('normalizes current catalog objects and legacy string values', () => {
        expect(challengeCatalogName({ name: ' Data Science ', track: 'DATA_SCIENCE' }, 'Competition'))
            .toBe('Data Science')
        expect(challengeCatalogName(' First 2 Finish ', 'Challenge'))
            .toBe('First 2 Finish')
        expect(challengeCatalogName({ id: 'missing-name' }, 'Competition'))
            .toBe('Competition')
        expect(challengeCatalogKey({ name: 'Data Science', track: 'DATA_SCIENCE' }))
            .toBe('datascience')
        expect(challengeCatalogKey('First2Finish'))
            .toBe(challengeCatalogKey('First 2 Finish'))
    })

    it('requires ACTIVE lifecycle status and an open registration phase', () => {
        expect(challengeRegistrationIsOpen({
            id: 'registration-open',
            name: 'Registration open',
            phases: [{ isOpen: true, name: 'Registration' }],
            status: 'ACTIVE',
        }))
            .toBe(true)
        expect(challengeRegistrationIsOpen({
            id: 'legacy-open',
            name: 'Legacy open',
            phases: [{ isOpen: true, name: 'Open' }],
            status: 'active',
        }))
            .toBe(true)
        expect(challengeRegistrationIsOpen({
            id: 'submission-only',
            name: 'Submission only',
            phases: [{ isOpen: true, name: 'Submission' }],
            status: 'ACTIVE',
        }))
            .toBe(false)
        expect(challengeRegistrationIsOpen({
            currentPhaseNames: ['Registration'],
            id: 'completed',
            name: 'Completed',
            status: 'COMPLETED',
        }))
            .toBe(false)
        expect(challengeRegistrationIsOpen({
            currentPhaseNames: ['Registration'],
            id: 'compact-active',
            name: 'Compact active',
            status: 'ACTIVE',
        }))
            .toBe(true)
    })

    it('finds overlapping submission phases without trusting the single current phase', () => {
        expect(challengeSubmissionIsOpen({
            currentPhase: { isOpen: true, name: 'Registration' },
            currentPhaseNames: ['Registration', 'Checkpoint Submission'],
            id: 'overlapping-phases',
            name: 'Overlapping phases',
            status: 'ACTIVE',
        }))
            .toBe(true)
        expect(challengeSubmissionIsOpen({
            id: 'legacy-open',
            name: 'Legacy open',
            phases: [{ isOpen: true, name: 'Open' }],
            status: 'ACTIVE',
        }))
            .toBe(true)
        expect(challengeSubmissionIsOpen({
            id: 'registration-only',
            name: 'Registration only',
            phases: [{ isOpen: true, name: 'Registration' }],
            status: 'ACTIVE',
        }))
            .toBe(false)
        expect(challengeSubmissionIsOpen({
            currentPhaseNames: ['Submission'],
            id: 'completed',
            name: 'Completed',
            status: 'COMPLETED',
        }))
            .toBe(false)
    })

    it('uses only valid PLACEMENT prizes and preserves their source positions', () => {
        const challenge = {
            id: 'prizes',
            name: 'Prizes',
            prizeSets: [
                { prizes: [{ type: 'USD', value: 500 }], type: 'CHECKPOINT' },
                {
                    prizes: [
                        { type: 'USD', value: 1000 },
                        { type: 'USD', value: Number.NaN },
                        { type: 'USD', value: 150 },
                    ],
                    type: 'placement',
                },
            ],
        }

        expect(challengePlacementPrizes(challenge))
            .toEqual([
                { placement: 1, type: 'USD', value: 1000 },
                { placement: 3, type: 'USD', value: 150 },
            ])
        expect(challengeTotalPrize(challenge))
            .toBe(1150)
        expect(challengePlacementPrizes({
            id: 'checkpoint-only',
            name: 'Checkpoint only',
            prizeSets: [{ prizes: [{ value: 500 }], type: 'CHECKPOINT' }],
        }))
            .toEqual([])
    })

    it('prefers the canonical overview total over a derived placement sum', () => {
        const canonicalOverviewChallenge = {
            id: 'overview-total',
            name: 'Overview total',
            overview: { totalPrizes: 2500, type: 'Challenge' },
            overviewTotalPrizes: 9999,
            prizeSets: [{ prizes: [{ value: 1000 }], type: 'PLACEMENT' }],
        }
        const legacyOnlyTotalChallenge = {
            id: 'no-placement-total',
            name: 'No placement total',
            overviewTotalPrizes: 9999,
            prizeSets: [{ prizes: [{ value: 1000 }], type: 'CHECKPOINT' }],
        }

        expect(challengeTotalPrize(canonicalOverviewChallenge))
            .toBe(2500)
        expect(challengeTotalPrize(legacyOnlyTotalChallenge))
            .toBeUndefined()
    })

    it('prefers the API current phase and otherwise selects the latest-started open phase', () => {
        const apiPhase = { isOpen: true, name: 'Checkpoint Submission' }
        expect(challengeCurrentPhase({
            currentPhase: apiPhase,
            id: 'api-current',
            name: 'API current',
            phases: [{ isOpen: true, name: 'Registration' }],
        }))
            .toBe(apiPhase)

        const registration = {
            isOpen: true,
            name: 'Registration',
            scheduledStartDate: '2026-08-01T00:00:00.000Z',
        }
        const submission = {
            actualStartDate: '2026-08-10T00:00:00.000Z',
            isOpen: true,
            name: 'Submission',
        }
        expect(challengeCurrentPhase({
            id: 'derived-current',
            name: 'Derived current',
            phases: [registration, submission, { isOpen: false, name: 'Review' }],
        }))
            .toBe(submission)
    })

    it('calculates clamped progress and a duration-derived end date safely', () => {
        const timing = challengePhaseTiming({
            duration: 3600,
            name: 'Submission',
            scheduledStartDate: '2026-08-14T00:00:00.000Z',
        }, Date.parse('2026-08-14T00:30:00.000Z'))

        expect(timing)
            .toEqual({
                endDate: '2026-08-14T01:00:00.000Z',
                progressPercent: 50,
                remainingMilliseconds: 30 * 60 * 1000,
                startDate: '2026-08-14T00:00:00.000Z',
            })
        expect(challengePhaseTiming({
            name: 'Future phase',
            scheduledEndDate: '2026-08-16T00:00:00.000Z',
            scheduledStartDate: '2026-08-15T00:00:00.000Z',
        }, Date.parse('2026-08-14T00:00:00.000Z')).progressPercent)
            .toBe(0)
        expect(challengePhaseTiming({
            name: 'Past phase',
            scheduledEndDate: '2026-08-13T00:00:00.000Z',
            scheduledStartDate: '2026-08-12T00:00:00.000Z',
        }, Date.parse('2026-08-14T00:00:00.000Z')).progressPercent)
            .toBe(100)
        expect(challengePhaseTiming({
            name: 'Malformed phase',
            scheduledEndDate: 'not-a-date',
            scheduledStartDate: 'also-not-a-date',
        }, Date.parse('2026-08-14T00:00:00.000Z')))
            .toEqual({ progressPercent: 0 })
        expect(challengePhaseTiming({
            duration: Number.MAX_VALUE,
            name: 'Out-of-range duration',
            scheduledStartDate: '2026-08-14T00:00:00.000Z',
        }, Date.parse('2026-08-14T00:00:00.000Z')))
            .toEqual({
                progressPercent: 0,
                startDate: '2026-08-14T00:00:00.000Z',
            })
    })

    it('formats compact time left without leaking invalid or negative values', () => {
        expect(formatChallengeTimeLeft({
            progressPercent: 0,
            remainingMilliseconds: ((12 * 60) + 30) * 60 * 1000,
        }))
            .toBe('12h 30m left')
        expect(formatChallengeTimeLeft({
            progressPercent: 0,
            remainingMilliseconds: ((2 * 24) + 3) * 60 * 60 * 1000,
        }))
            .toBe('2d 3h left')
        expect(formatChallengeTimeLeft({ progressPercent: 100, remainingMilliseconds: -1 }))
            .toBe('Past due')
        expect(formatChallengeTimeLeft({ progressPercent: 0 }))
            .toBe('')
    })
})
