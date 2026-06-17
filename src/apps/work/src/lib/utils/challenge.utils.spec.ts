import {
    getSubmissionExampleScore,
    getSubmissionProvisionalScore,
    getSubmissionSystemScore,
    getSubmissionTestProgress,
    isMarathonMatchChallenge,
} from './challenge.utils'

jest.mock('../constants', () => ({
    CHALLENGE_STATUS: {
        ACTIVE: 'ACTIVE',
        CANCELLED: 'CANCELLED',
        COMPLETED: 'COMPLETED',
        DRAFT: 'DRAFT',
    },
}))

describe('challenge utils', () => {
    describe('isMarathonMatchChallenge', () => {
        it('recognizes Marathon Match from the canonical challenge type id', () => {
            expect(isMarathonMatchChallenge({
                typeId: '929bc408-9cf2-4b3e-ba71-adfbf693046c',
            }))
                .toBe(true)
        })

        it('returns false when no Marathon Match identifiers are present', () => {
            expect(isMarathonMatchChallenge({
                tags: ['development'],
                type: {
                    name: 'Code',
                },
                typeId: '927abff4-7af9-4145-8ba1-577c16e64e2e',
            }))
                .toBe(false)
        })
    })

    describe('getSubmissionExampleScore', () => {
        it('returns only example marathon scores', () => {
            expect(getSubmissionExampleScore({
                reviewSummation: [
                    {
                        aggregateScore: 10,
                        isExample: true,
                        metadata: {
                            testType: 'example',
                        },
                    },
                    {
                        aggregateScore: 12,
                        isProvisional: true,
                        metadata: {
                            testProcess: 'provisional',
                        },
                    },
                ],
            }))
                .toBe(10)
        })

        it('returns the latest example summation', () => {
            expect(getSubmissionExampleScore({
                reviewSummation: [
                    {
                        aggregateScore: 10,
                        isExample: true,
                        updatedAt: '2026-06-17T01:00:00.000Z',
                    },
                    {
                        aggregateScore: 15.25,
                        isExample: true,
                        updatedAt: '2026-06-17T02:00:00.000Z',
                    },
                ],
            }))
                .toBe(15.25)
        })
    })

    describe('getSubmissionTestProgress', () => {
        it('returns example progress from marathon metadata test type', () => {
            expect(getSubmissionTestProgress({
                reviewSummation: [
                    {
                        aggregateScore: 10,
                        isExample: true,
                        metadata: {
                            testProgress: 1,
                            testStatus: 'SUCCESS',
                            testType: 'example',
                        },
                    },
                ],
            }))
                .toEqual({
                    process: 'example',
                    progressPercent: '100%',
                    status: 'SUCCESS',
                })
        })
    })

    describe('getSubmissionProvisionalScore', () => {
        it('returns only provisional marathon scores', () => {
            expect(getSubmissionProvisionalScore({
                review: [
                    {
                        finalScore: 95,
                        initialScore: 90,
                    },
                ],
                reviewSummation: [
                    {
                        aggregateScore: 12,
                        isProvisional: true,
                        metadata: {
                            testProcess: 'provisional',
                        },
                    },
                    {
                        aggregateScore: 20,
                        isFinal: true,
                        metadata: {
                            testProcess: 'system',
                        },
                    },
                ],
            }))
                .toBe(12)
        })

        it('returns the latest provisional summation before stale raw scores', () => {
            expect(getSubmissionProvisionalScore({
                reviewSummation: [
                    {
                        aggregateScore: 93.82,
                        isProvisional: true,
                        metadata: {
                            testProcess: 'provisional',
                        },
                        updatedAt: '2026-05-20T03:41:00.000Z',
                    },
                    {
                        aggregateScore: 73.2513061836071,
                        isProvisional: true,
                        metadata: {
                            testProcess: 'provisional',
                        },
                        updatedAt: '2026-05-20T04:04:00.000Z',
                    },
                ],
                submissions: [
                    {
                        provisionalScore: 93.82,
                    },
                ],
            }))
                .toBe(73.2513061836071)
        })

        it('returns undefined when provisional scoring is unavailable', () => {
            expect(getSubmissionProvisionalScore({
                review: [
                    {
                        finalScore: 95,
                        initialScore: 90,
                    },
                ],
                reviewSummation: [
                    {
                        aggregateScore: 20,
                        isFinal: true,
                        metadata: {
                            testProcess: 'system',
                        },
                    },
                ],
            }))
                .toBeUndefined()
        })

        it('does not treat example summations as provisional scores', () => {
            expect(getSubmissionProvisionalScore({
                reviewSummation: [
                    {
                        aggregateScore: 10,
                        isExample: true,
                        isFinal: false,
                    },
                ],
            }))
                .toBeUndefined()
        })
    })

    describe('getSubmissionSystemScore', () => {
        it('returns only system marathon scores', () => {
            expect(getSubmissionSystemScore({
                review: [
                    {
                        finalScore: 95,
                        initialScore: 90,
                    },
                ],
                reviewSummation: [
                    {
                        aggregateScore: 12,
                        isProvisional: true,
                        metadata: {
                            testProcess: 'provisional',
                        },
                    },
                    {
                        aggregateScore: 20,
                        isFinal: true,
                        metadata: {
                            testProcess: 'system',
                        },
                    },
                ],
            }))
                .toBe(20)
        })

        it('returns the latest system summation before stale raw scores', () => {
            expect(getSubmissionSystemScore({
                reviewSummation: [
                    {
                        aggregateScore: 60,
                        isFinal: true,
                        metadata: {
                            testProcess: 'system',
                        },
                        updatedAt: '2026-05-20T03:41:00.000Z',
                    },
                    {
                        aggregateScore: 88.5,
                        isFinal: true,
                        metadata: {
                            testProcess: 'system',
                        },
                        updatedAt: '2026-05-20T04:04:00.000Z',
                    },
                ],
                submissions: [
                    {
                        finalScore: 60,
                    },
                ],
            }))
                .toBe(88.5)
        })

        it('returns undefined when system scoring is unavailable', () => {
            expect(getSubmissionSystemScore({
                review: [
                    {
                        finalScore: 95,
                        initialScore: 90,
                    },
                ],
                reviewSummation: [
                    {
                        aggregateScore: 12,
                        isProvisional: true,
                        metadata: {
                            testProcess: 'provisional',
                        },
                    },
                ],
            }))
                .toBeUndefined()
        })

        it('ignores in-progress placeholder scores', () => {
            expect(getSubmissionSystemScore({
                reviewSummation: [
                    {
                        aggregateScore: -1,
                        isFinal: true,
                        metadata: {
                            testProcess: 'system',
                            testStatus: 'IN PROGRESS',
                        },
                    },
                ],
            }))
                .toBeUndefined()
        })
    })
})
