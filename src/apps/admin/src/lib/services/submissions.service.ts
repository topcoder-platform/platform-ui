/**
 * Submissions service
 */
import { EnvironmentConfig } from '~/config'
import { xhrDeleteAsync, xhrGetAsync, xhrGetBlobAsync } from '~/libs/core'

import {
    adjustSubmissionsResponse,
    ApiV5ResponseSuccess,
    MemberSubmission,
    RequestBusAPIAVScanPayload,
    Submission,
    ValidateS3URIResult,
} from '../models'
import { validateS3URI } from '../utils'

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
        `${EnvironmentConfig.API.V6}/submissions?challengeId=${challengeId}`,
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
        `${EnvironmentConfig.API.V6}/submissions/${submissionId}`,
    )
    return result
}

/**
 * Download submission file
 * @param submissionId submission id
 * @returns resolves to the submission file
 */
export const downloadSubmissionFile = async (
    submissionId: string,
): Promise<Blob> => {
    const results = await xhrGetBlobAsync<Blob>(
        `${EnvironmentConfig.API.V5}/submissions/${submissionId}/download`,
    )
    return results
}

/**
 * Create av scan submission payload
 * @param submissionInfo submission info
 * @returns resolves to the av scan submission payload
 */
export const createAvScanSubmissionPayload = async (
    submissionInfo: Submission,
): Promise<RequestBusAPIAVScanPayload> => {
    const url = submissionInfo.url
    const { isValid, key: fileName }: ValidateS3URIResult = validateS3URI(url)
    if (!isValid) {
        throw new Error('Submission url is not a valid')
    }

    return {
        callbackKafkaTopic: EnvironmentConfig.ADMIN.SUBMISSION_SCAN_TOPIC,
        callbackOption: 'kafka',
        cleanDestinationBucket: EnvironmentConfig.ADMIN.AWS_CLEAN_BUCKET,
        fileName,
        moveFile: true,
        quarantineDestinationBucket:
            EnvironmentConfig.ADMIN.AWS_QUARANTINE_BUCKET,
        submissionId: submissionInfo.id,
        url,
    }
}
