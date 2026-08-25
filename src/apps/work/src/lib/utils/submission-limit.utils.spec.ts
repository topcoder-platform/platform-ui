import {
    hasChallengeSubmissions,
    isSubmissionLimitCountMissing,
} from './submission-limit.utils'

function buildSubmissionLimitMetadata(count: string, limit: string): Array<{
    name: string
    value: string
}> {
    return [{
        name: 'submissionLimit',
        value: JSON.stringify({
            count,
            limit,
            unlimited: limit === 'true'
                ? 'false'
                : 'true',
        }),
    }]
}

describe('isSubmissionLimitCountMissing', () => {
    it('detects a limited setting without a count', () => {
        expect(isSubmissionLimitCountMissing(buildSubmissionLimitMetadata('', 'true')))
            .toBe(true)
    })

    it('detects a limited setting with a zero count', () => {
        expect(isSubmissionLimitCountMissing(buildSubmissionLimitMetadata('0', 'true')))
            .toBe(true)
    })

    it('accepts a limited setting with a positive count', () => {
        expect(isSubmissionLimitCountMissing(buildSubmissionLimitMetadata('3', 'true')))
            .toBe(false)
    })

    it('accepts an unlimited setting', () => {
        expect(isSubmissionLimitCountMissing(buildSubmissionLimitMetadata('', 'false')))
            .toBe(false)
    })

    it('accepts missing and malformed metadata', () => {
        expect(isSubmissionLimitCountMissing(undefined))
            .toBe(false)
        expect(isSubmissionLimitCountMissing([{
            name: 'submissionLimit',
            value: '{invalid',
        }]))
            .toBe(false)
    })
})

describe('hasChallengeSubmissions', () => {
    it('reports contest submissions', () => {
        expect(hasChallengeSubmissions({ numOfSubmissions: 1 }))
            .toBe(true)
    })

    it('reports checkpoint submissions', () => {
        expect(hasChallengeSubmissions({ numOfCheckpointSubmissions: '2' }))
            .toBe(true)
    })

    it('reports no submissions', () => {
        expect(hasChallengeSubmissions({
            numOfCheckpointSubmissions: 0,
            numOfSubmissions: 0,
        }))
            .toBe(false)
        expect(hasChallengeSubmissions(undefined))
            .toBe(false)
    })
})
