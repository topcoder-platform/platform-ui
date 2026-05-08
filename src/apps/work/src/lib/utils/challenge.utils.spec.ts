import {
    getSubmissionProvisionalScore,
    getSubmissionSystemScore,
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
