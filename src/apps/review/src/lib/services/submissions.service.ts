/**
 * Submissions service
 */
import { MockSubmissions } from '../../mock-datas'
import { adjustSubmissionInfo, SubmissionInfo } from '../models'

/**
 * Fetch challenge submissions
 * @returns resolves to the challenge submissions
 */
export const fetchSubmissions = async (): Promise<SubmissionInfo[]> => Promise.resolve(
    MockSubmissions.map(adjustSubmissionInfo) as SubmissionInfo[],
)
