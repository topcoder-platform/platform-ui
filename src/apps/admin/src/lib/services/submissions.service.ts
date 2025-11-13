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
interface SubmissionsListResponse {
    data?: Submission[]
    meta?: {
        totalPages?: number
        page?: number
        perPage?: number
    }
}

const SUBMISSIONS_PER_PAGE = 100

export const fetchSubmissionsOfChallenge = async (
    challengeId: string,
): Promise<MemberSubmission[]> => {
    if (!challengeId) {
        return Promise.resolve([])
    }

    const submissions: Submission[] = []

    const makeQuery = (page: number): string => {
        const base = `${EnvironmentConfig.API.V6}/submissions`
        const params = new URLSearchParams({
            challengeId,
            page: String(page),
            perPage: String(SUBMISSIONS_PER_PAGE),
        })
        return `${base}?${params.toString()}`
    }

    const firstResponse = await xhrGetAsync<SubmissionsListResponse>(makeQuery(1))
    submissions.push(...(firstResponse?.data ?? []))
    const totalPages = firstResponse?.meta?.totalPages ?? 1

    if (totalPages > 1) {
        const pages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2)
        const responses = await Promise.all(
            pages.map(p => xhrGetAsync<SubmissionsListResponse>(makeQuery(p))),
        )
        for (const res of responses) {
            submissions.push(...(res?.data ?? []))
        }
    }

    return adjustSubmissionsResponse(submissions)
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
        `${EnvironmentConfig.API.V6}/submissions/${submissionId}/download`,
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
    if (!url) {
        throw new Error('Submission url is not valid')
    }

    const {
        isValid,
        key: fileName,
        bucket,
    }: ValidateS3URIResult = validateS3URI(url)
    const isQuarantineBucket = Boolean(
        bucket && bucket.toLowerCase()
            .endsWith('-dmz'),
    )
    const allowQuarantineRescan = submissionInfo.virusScan === false
        && isQuarantineBucket

    if (!isValid && !allowQuarantineRescan) {
        throw new Error('Submission url is not valid')
    }

    if (!fileName) {
        throw new Error('Submission url is not valid')
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
