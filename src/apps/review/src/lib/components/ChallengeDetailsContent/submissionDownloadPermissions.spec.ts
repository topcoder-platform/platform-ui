import { canDownloadSubmissionFromSubmissionsTab } from './submissionDownloadPermissions'

describe('canDownloadSubmissionFromSubmissionsTab', () => {
    it('allows downloads when the challenge exposes all submissions', () => {
        expect(canDownloadSubmissionFromSubmissionsTab({
            canViewSubmissions: true,
            isOwnSubmission: false,
        }))
            .toBe(true)
    })

    it('allows downloads for a member s own submission when the challenge hides other submissions', () => {
        expect(canDownloadSubmissionFromSubmissionsTab({
            canViewSubmissions: false,
            isOwnSubmission: true,
        }))
            .toBe(true)
    })

    it('blocks downloads for other members when the challenge hides submissions', () => {
        expect(canDownloadSubmissionFromSubmissionsTab({
            canViewSubmissions: false,
            isOwnSubmission: false,
        }))
            .toBe(false)
    })
})
