/**
 * Submissions service
 */
import { EnvironmentConfig } from '~/config'
import { xhrDeleteAsync, xhrGetAsync } from '~/libs/core'

import {
    adjustSubmissionsResponse,
    ApiV5ResponseSuccess,
    MemberSubmission,
    Submission,
} from '../models'

/**
 * Gets all submissions of challenge
 * @param challengeId challenge id
 * @returns resolves to the submission list
 */
export const fetchSubmissionsOfChallenge = async (
    challengeId: string,
): Promise<MemberSubmission[]> => {
    if (!challengeId) {
        return Promise.resolve([])
    }

    const results = await xhrGetAsync<Submission[]>(
        `${EnvironmentConfig.API.V5}/submissions?challengeId=${challengeId}`,
    )
    return adjustSubmissionsResponse(results)
}

/**
 * Remove the submission
 * @param submissionId the submission id
 * @returns resolves to success or failure calling api
 */
export const removeSubmission = async (
    submissionId: string,
): Promise<ApiV5ResponseSuccess> => {
    const result = await xhrDeleteAsync<ApiV5ResponseSuccess>(
        `${EnvironmentConfig.API.V5}/submissions/${submissionId}`,
    )
    return result
}
