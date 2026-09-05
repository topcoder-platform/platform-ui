import {
    attachMarathonReviewSummations,
    buildMarathonDashboardData,
    formatMarathonFinalScore,
    formatMarathonScore,
    isMarathonMatchChallenge,
    marathonDashboardIsEnabled,
    marathonSubmissionScores,
    marathonSubmissionTestProgress,
    shouldShowFinalSubmissionScores,
} from './marathon-match.utils'

describe('Marathon Match challenge detail utilities', () => {
    it('recognizes Marathon Match catalog names, IDs, and tags', () => {
        expect(isMarathonMatchChallenge({ id: 'one', name: 'One', type: 'Marathon Match' }))
            .toBe(true)
        expect(isMarathonMatchChallenge({
            id: 'two',
            name: 'Two',
            type: { id: '929bc408-9cf2-4b3e-ba71-adfbf693046c', name: 'Match' },
        }))
            .toBe(true)
        expect(isMarathonMatchChallenge({ id: 'three', name: 'Three', tags: ['MM'] }))
            .toBe(true)
        expect(isMarathonMatchChallenge({ id: 'four', name: 'Four', type: 'Challenge' }))
            .toBe(false)
    })

    it('exposes the standalone dashboard only for an enabled Marathon Match', () => {
        expect(marathonDashboardIsEnabled({
            id: 'enabled',
            metadata: [{ name: 'show_data_dashboard', value: 'true' }],
            name: 'Enabled',
            type: 'Marathon Match',
        }))
            .toBe(true)
        expect(marathonDashboardIsEnabled({
            id: 'disabled',
            metadata: [{ name: 'show_data_dashboard', value: false }],
            name: 'Disabled',
            type: 'Marathon Match',
        }))
            .toBe(false)
        expect(marathonDashboardIsEnabled({
            id: 'not-mm',
            metadata: [{ name: 'show_data_dashboard', value: true }],
            name: 'Not MM',
            type: 'Challenge',
        }))
            .toBe(false)
    })

    it('prefers the latest phase-specific summations and retains valid zero scores', () => {
        expect(marathonSubmissionScores({
            finalScore: 41,
            id: 'submission',
            initialScore: 12,
            reviewSummation: [
                {
                    aggregateScore: 27.5,
                    createdAt: '2026-06-01T10:00:00.000Z',
                    id: 'old-provisional',
                    isProvisional: true,
                },
                {
                    aggregateScore: 31.25,
                    createdAt: '2026-06-02T10:00:00.000Z',
                    id: 'new-provisional',
                    isProvisional: true,
                },
                {
                    aggregateScore: 0,
                    createdAt: '2026-06-03T10:00:00.000Z',
                    id: 'final',
                    isFinal: true,
                },
            ],
        }))
            .toEqual({ finalScore: 0, provisionalScore: 31.25 })
        expect(formatMarathonScore(0, '-'))
            .toBe('0')
        expect(formatMarathonScore(undefined, 'N/A'))
            .toBe('N/A')
        expect(formatMarathonFinalScore(-1, '-'))
            .toBe('0')
        expect(marathonSubmissionScores({
            id: 'legacy-unmarked',
            reviewSummation: [{ aggregateScore: 18.75, id: 'unmarked' }],
        }))
            .toEqual({ finalScore: undefined, provisionalScore: 18.75 })
        expect(marathonSubmissionScores({
            aiDecisionScore: '80',
            id: 'active-ai-only',
        }))
            .toEqual({ finalScore: 80, provisionalScore: undefined })
    })

    it('matches community-app final-score release timing and completed non-MM gating', () => {
        const finalSubmission = { finalScore: 98.98, id: 'final' }
        expect(shouldShowFinalSubmissionScores({
            id: 'open',
            name: 'Open',
            phases: [{ isOpen: true, name: 'Submission' }],
            type: 'Marathon Match',
        }, [finalSubmission]))
            .toBe(false)
        expect(shouldShowFinalSubmissionScores({
            id: 'reviewed',
            name: 'Reviewed',
            phases: [{
                isOpen: false,
                name: 'Review',
                scheduledStartDate: '2020-01-01T00:00:00.000Z',
            }],
            type: 'Marathon Match',
        }, []))
            .toBe(true)
        expect(shouldShowFinalSubmissionScores({
            id: 'data-ready',
            name: 'Data ready',
            phases: [],
            type: 'Marathon Match',
        }, [], ['91.25']))
            .toBe(true)
        expect(shouldShowFinalSubmissionScores({
            id: 'active-code',
            name: 'Active code',
            status: 'ACTIVE',
        }, [finalSubmission]))
            .toBe(false)
        expect(shouldShowFinalSubmissionScores({
            id: 'completed-code',
            name: 'Completed code',
            status: 'COMPLETED',
        }, [finalSubmission]))
            .toBe(true)
    })

    it('attaches challenge-level summations only to their matching attempts', () => {
        expect(attachMarathonReviewSummations(
            [{ id: 'one' }, { id: 'two' }],
            [
                { aggregateScore: 10, id: 'score-one', submissionId: 'one' },
                { aggregateScore: 20, id: 'score-two', submissionId: 'two' },
            ],
        ))
            .toEqual([
                {
                    id: 'one',
                    reviewSummation: [{ aggregateScore: 10, id: 'score-one', submissionId: 'one' }],
                },
                {
                    id: 'two',
                    reviewSummation: [{ aggregateScore: 20, id: 'score-two', submissionId: 'two' }],
                },
            ])
    })

    it('normalizes member-safe Marathon Match test process, status, and progress', () => {
        expect(marathonSubmissionTestProgress({
            id: 'submission',
            reviewSummation: [{
                id: 'progress',
                isFinal: true,
                metadata: {
                    testProgress: 0.5,
                    testStatus: 'PROCESSING',
                },
            }],
        }))
            .toEqual({
                process: 'System',
                progress: 50,
                status: 'In progress',
            })
    })

    it('falls back to truthful submission lifecycle states when test metadata is absent', () => {
        expect(marathonSubmissionTestProgress({
            id: 'failed-screening',
            status: 'ACTIVE',
            virusScan: false,
        }))
            .toEqual({ process: 'Provisional', progress: 0, status: 'Failed' })
        expect(marathonSubmissionTestProgress({
            id: 'legacy-quarantine',
            url: 'https://s3.amazonaws.com/submissions-quarantine/member/file.zip',
        }))
            .toEqual({ process: 'Provisional', progress: 0, status: 'Failed' })
        expect(marathonSubmissionTestProgress({
            id: 'failed-system-review',
            review: [{ status: 'FAILED' }],
        }))
            .toEqual({ process: 'System', progress: 0, status: 'Failed' })
        expect(marathonSubmissionTestProgress({
            id: 'failed-test-metadata',
            reviewSummation: [{
                id: 'failed-test',
                metadata: { testStatus: 'FAILED' },
            }],
        }))
            .toEqual({ process: 'Provisional', progress: 0, status: 'Failed' })
        expect(marathonSubmissionTestProgress({
            id: 'active',
            status: 'ACTIVE',
        }))
            .toEqual({
                process: 'System',
                progress: 0,
                status: 'In progress',
            })
    })

    it('builds the provisional score timeline, excludes failures, and keeps the latest rewrite', () => {
        expect(buildMarathonDashboardData([
            {
                aggregateScore: 20,
                createdAt: '2026-06-01T10:00:00.000Z',
                id: 'first',
                isProvisional: true,
                submissionId: 'submission-one',
                submitterHandle: 'coder',
                submitterId: 123,
                submitterMaxRating: 2100,
            },
            {
                aggregateScore: 35.12,
                createdAt: '2026-06-02T10:00:00.000Z',
                id: 'rewrite',
                isProvisional: true,
                submissionId: 'submission-one',
                submitterHandle: 'coder',
                submitterId: 123,
                submitterMaxRating: 2100,
            },
            {
                aggregateScore: 50,
                createdAt: '2026-06-03T10:00:00.000Z',
                id: 'failed',
                isPassing: false,
                isProvisional: true,
                submissionId: 'submission-two',
                submitterHandle: 'coder',
                submitterId: 123,
            },
            {
                aggregateScore: 40,
                createdAt: '2026-06-03T11:00:00.000Z',
                id: 'still-processing',
                isProvisional: true,
                metadata: { testProgress: 0.5, testStatus: 'IN PROGRESS' },
                submissionId: 'submission-three',
                submitterHandle: 'coder',
                submitterId: 123,
            },
            {
                aggregateScore: 90,
                createdAt: '2026-06-04T10:00:00.000Z',
                id: 'final',
                isFinal: true,
                submissionId: 'submission-one',
                submitterHandle: 'coder',
                submitterId: 123,
            },
        ]))
            .toEqual([{
                handle: 'coder',
                rating: 2100,
                submissions: [{
                    createdAt: '2026-06-02T10:00:00.000Z',
                    score: 35.12,
                    submissionId: 'submission-one',
                }],
            }])
    })
})
