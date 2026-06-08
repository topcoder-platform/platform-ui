import {
    getReviewSummationMarathonTestType,
    getSubmissionMarathonTestSummations,
    matchesSubmissionMarathonTestTypeFilter,
} from './marathon-match-submission.utils'

describe('marathon-match-submission.utils', () => {
    it('resolves test type from review summation metadata', () => {
        expect(getReviewSummationMarathonTestType({
            metadata: {
                testType: 'provisional',
            },
        }))
            .toBe('provisional')

        expect(getReviewSummationMarathonTestType({
            metadata: {
                testProcess: 'system',
            },
        }))
            .toBe('system')
    })

    it('falls back to review summation phase flags', () => {
        expect(getReviewSummationMarathonTestType({
            isProvisional: true,
        }))
            .toBe('provisional')

        expect(getReviewSummationMarathonTestType({
            isFinal: true,
        }))
            .toBe('system')
    })

    it('filters submission summations by selected test type', () => {
        const submission = {
            reviewSummation: [
                {
                    id: 'system-summation',
                    metadata: {
                        testType: 'system',
                    },
                },
                {
                    id: 'provisional-summation',
                    metadata: {
                        testType: 'provisional',
                    },
                },
                {
                    id: 'example-summation',
                    metadata: {
                        testType: 'example',
                    },
                },
            ],
        }

        expect(getSubmissionMarathonTestSummations(submission, 'all')
            .map(reviewSummation => reviewSummation.id))
            .toEqual([
                'provisional-summation',
                'system-summation',
            ])

        expect(getSubmissionMarathonTestSummations(submission, 'system')
            .map(reviewSummation => reviewSummation.id))
            .toEqual(['system-summation'])
    })

    it('matches submissions only when the selected test type exists', () => {
        const submission = {
            reviewSummation: [
                {
                    metadata: {
                        testType: 'provisional',
                    },
                },
            ],
        }

        expect(matchesSubmissionMarathonTestTypeFilter(submission, 'all'))
            .toBe(true)
        expect(matchesSubmissionMarathonTestTypeFilter(submission, 'provisional'))
            .toBe(true)
        expect(matchesSubmissionMarathonTestTypeFilter(submission, 'system'))
            .toBe(false)
    })
})
