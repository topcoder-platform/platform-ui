/**
 * Submissions service
 */
// Internal imports
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
    role?: string,
): Promise<SubmissionInfo[]> => {
    if (role === SUBMITTER) {
        const submission = MockSubmissions.filter(
            sub => sub.handle === MOCKHANDLE,
        )
            .map(adjustSubmissionInfo) as SubmissionInfo[]

        submission.forEach(s => {
            s.reviews = MockSubmissionReviews.map(
                adjustReviewResult,
            ) as ReviewResult[]
        })

        return Promise.resolve(submission)
    }

    return Promise.resolve(
        MockSubmissions.map(adjustSubmissionInfo)
            .map(s => ({
                ...s,
                reviews: s?.reviews?.map(adjustReviewResult),
            })) as SubmissionInfo[],
    )
}
