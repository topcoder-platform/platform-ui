import { canViewSubmissionDuplicates } from './submissionDuplicates'

describe('canViewSubmissionDuplicates', () => {
    it('allows administrators from the token roles', () => {
        expect(canViewSubmissionDuplicates([], ['Topcoder User', 'administrator']))
            .toBe(true)
    })

    it('allows project managers from the token roles', () => {
        expect(canViewSubmissionDuplicates([], ['Project Manager']))
            .toBe(true)
    })

    it.each([
        'Copilot',
        'Manager',
        'Reviewer',
        'Iterative Reviewer',
        'Checkpoint Screener',
    ])('allows the %s challenge resource role', challengeRole => {
        expect(canViewSubmissionDuplicates([challengeRole], ['Topcoder User']))
            .toBe(true)
    })

    it('denies submitters', () => {
        expect(canViewSubmissionDuplicates(['Submitter'], ['Topcoder User']))
            .toBe(false)
    })

    it('denies observers and approvers, which the API does not accept', () => {
        expect(canViewSubmissionDuplicates(['Observer', 'Approver'], ['Topcoder User']))
            .toBe(false)
    })

    it('denies anonymous callers', () => {
        expect(canViewSubmissionDuplicates(undefined, undefined))
            .toBe(false)
    })
})
