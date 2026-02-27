import qs from 'qs'

import { EnvironmentConfig } from '~/config'
import {
    xhrDeleteAsync,
    xhrGetAsync,
    xhrGetBlobAsync,
    xhrGetPaginatedAsync,
    xhrPostAsync,
} from '~/libs/core'

import {
    type BackendSubmission,
    convertBackendSubmission,
    type SubmissionInfo,
} from '../models'

const submissionsBaseUrl = `${EnvironmentConfig.API.V6}`

export type SubmitChallengeType
    = 'CONTEST_SUBMISSION'
    | 'CHECKPOINT_SUBMISSION'
    | 'STUDIO_FINAL_FIX_SUBMISSION'

export interface SubmitChallengePayload {
    challengeId: string
    fileType?: string
    memberId: string
    type: SubmitChallengeType
    url: string
}

/**
 * Fetches challenge submissions for the current member context.
 *
 * @param challengeId Challenge identifier.
 * @returns Converted submissions list.
 */
export const fetchSubmissions = async (
    challengeId: string,
): Promise<SubmissionInfo[]> => {
    const query = qs.stringify({
        challengeId,
        perPage: 500,
    })
    const response = await xhrGetPaginatedAsync<BackendSubmission[]>(
        `${submissionsBaseUrl}/submissions?${query}`,
    )

    return response.data.map(convertBackendSubmission)
}

/**
 * Fetches submissions created by a specific member for a challenge.
 *
 * @param challengeId Challenge identifier.
 * @param memberId Member identifier.
 * @returns Converted submissions list.
 */
export const fetchMySubmissions = async (
    challengeId: string,
    memberId: string,
): Promise<SubmissionInfo[]> => {
    const query = qs.stringify({
        challengeId,
        memberId,
        perPage: 500,
    })
    const response = await xhrGetPaginatedAsync<BackendSubmission[]>(
        `${submissionsBaseUrl}/submissions?${query}`,
    )

    return response.data.map(convertBackendSubmission)
}

/**
 * Fetches recent submissions created by a member across challenges.
 *
 * @param memberId Member identifier.
 * @param perPage Number of submissions to fetch. Defaults to 5.
 * @returns Converted submissions list.
 */
export const fetchMemberSubmissions = async (
    memberId: string,
    perPage: number = 5,
): Promise<SubmissionInfo[]> => {
    const query = qs.stringify({
        memberId,
        perPage,
    })
    const response = await xhrGetPaginatedAsync<BackendSubmission[]>(
        `${submissionsBaseUrl}/submissions?${query}`,
    )

    return response.data.map(convertBackendSubmission)
}

/**
 * Fetches artifact ids associated with a submission.
 *
 * @param submissionId Submission identifier.
 * @returns Artifact id list.
 */
export const fetchSubmissionArtifacts = async (
    submissionId: string,
): Promise<string[]> => {
    const artifacts = await xhrGetAsync<Array<{ id?: string } | string>>(
        `${submissionsBaseUrl}/submissions/${submissionId}/artifacts`,
    )

    return artifacts
        .map(item => (typeof item === 'string' ? item : item.id))
        .filter((item): item is string => Boolean(item))
}

/**
 * Downloads a specific submission artifact.
 *
 * @param submissionId Submission identifier.
 * @param artifactId Artifact identifier.
 * @returns Artifact blob payload.
 */
export const downloadSubmissionArtifact = async (
    submissionId: string,
    artifactId: string,
): Promise<Blob> => xhrGetBlobAsync<Blob>(
    `${submissionsBaseUrl}/submissions/${submissionId}/artifacts/${artifactId}/download`,
)

/**
 * Creates a submission record for a challenge.
 *
 * @param payload Submission payload.
 * @returns Created backend submission payload.
 */
export const submitChallenge = async (
    payload: SubmitChallengePayload,
): Promise<BackendSubmission> => {
    const body = new FormData()
    body.append('challengeId', payload.challengeId)
    body.append('memberId', payload.memberId)
    body.append('type', payload.type)
    body.append('url', payload.url)

    if (payload.fileType) {
        body.append('fileType', payload.fileType)
    }

    return xhrPostAsync<FormData, BackendSubmission>(
        `${submissionsBaseUrl}/submissions`,
        body,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        },
    )
}

/**
 * Deletes a submission.
 *
 * @param submissionId Submission identifier.
 */
export const deleteSubmission = async (
    submissionId: string,
): Promise<void> => {
    await xhrDeleteAsync<void>(
        `${submissionsBaseUrl}/submissions/${submissionId}`,
    )
}
