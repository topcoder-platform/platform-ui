/**
 * Submissions service
 */
// Internal imports
import { SUBMITTER } from '../../config/index.config'
import { MockSubmissionReviews, MockSubmissions } from '../../mock-datas'
import {
    adjustReviewResult,
    adjustSubmissionInfo,
    ReviewResult,
    SubmissionInfo,
} from '../models'

/**
 * Fetch mock challenge submissions
 * @returns resolves to the challenge submissions
 */
export const fetchMockSubmissions = async (
    role?: string,
): Promise<SubmissionInfo[]> => {
    if (role === SUBMITTER) {
        const submission = MockSubmissions.map(
            adjustSubmissionInfo,
        ) as SubmissionInfo[]

        submission.forEach(s => {
            s.reviews = MockSubmissionReviews.map(
                adjustReviewResult,
            ) as ReviewResult[]
        })

        return Promise.resolve(submission)
    }

    return Promise.resolve(
        MockSubmissions
            .map(s => {
                const results = adjustSubmissionInfo(s)
                return ({
                    ...results,
                    reviews: results?.reviews?.map(adjustReviewResult),
                })
            }) as SubmissionInfo[],
    )
}
