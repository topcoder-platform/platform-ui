/**
 * Submissions service
 */
import { MOCKHANDLE, SUBMITTER } from '../../config/index.config'
import { MockSubmissionReviews, MockSubmissions } from '../../mock-datas'
import {
    adjustReviewResult,
    adjustSubmissionInfo,
    ReviewResult,
    SubmissionInfo,
} from '../models'

/**
 * Fetch challenge submissions
 * @returns resolves to the challenge submissions
 */
export const fetchSubmissions = async (
    role?: string
): Promise<SubmissionInfo[]> => {
    if (role === SUBMITTER) {
        let submission = MockSubmissions.filter(
            (submission) => submission.handle === MOCKHANDLE
        ).map(adjustSubmissionInfo) as SubmissionInfo[]
        submission.forEach(
            (s) =>
                (s.reviews = MockSubmissionReviews.map(
                    adjustReviewResult
                ) as ReviewResult[])
        )
        return Promise.resolve(submission)
    }
    return Promise.resolve(
        MockSubmissions.map(adjustSubmissionInfo) as SubmissionInfo[]
    )
}
