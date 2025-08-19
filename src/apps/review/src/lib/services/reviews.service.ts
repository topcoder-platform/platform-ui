/**
 * Reviews service
 */
import { forEach, orderBy } from 'lodash'
import qs from 'qs'

import { EnvironmentConfig } from '~/config'
import {
    xhrGetAsync,
    xhrGetBlobAsync,
    xhrGetPaginatedAsync,
    xhrPostAsync,
} from '~/libs/core'

import {
    adjustReviewInfo,
    BackendChallengeInfo,
    BackendContactRequest,
    BackendProjectResult,
    BackendResponseWithMeta,
    BackendSubmission,
    ChallengeInfo,
    convertBackendChallengeInfo,
    convertBackendProjectResultToProjectResult,
    FormContactManager,
    ProjectResult,
    ReviewInfo,
} from '../models'
import { MockReviewEdit, MockReviewFull } from '../../mock-datas'

const challengeBaseUrl = `${EnvironmentConfig.API.V6}`

/**
 * Fetch active reviews
 *
 * @param page current page
 * @param perPage number of item per page
 * @param challengeTypeId challenge type id
 * @param challengeTrackId challenge track id
 * @param memberId member id
 * @returns resolves to the array of active reviews
 */
export const fetchActiveReviews = async (
    page: number,
    perPage: number,
    challengeTypeId: string,
    challengeTrackId: string,
    memberId: string,
): Promise<{
    data: ChallengeInfo[]
    totalPages: number
}> => {
    const results = await xhrGetPaginatedAsync<BackendChallengeInfo[]>(
        `${challengeBaseUrl}/challenges/?status=ACTIVE&${qs.stringify({
            ...(challengeTypeId ? {
                typeId: challengeTypeId,
            } : {}),
            ...(challengeTrackId ? {
                trackId: challengeTrackId,
            } : {}),
            memberId,
            page,
            perPage,
        })}`,
    )
    return {
        data: results.data.map(
            (item, index) => convertBackendChallengeInfo(
                item,
                perPage * (page - 1) + index + 1,
            ) as ChallengeInfo,
        ),
        totalPages: results.totalPages,
    }
}

/**
 * Fetch review info
 *
 * @param isEdit is edit ui
 * @returns resolves to the review info
 */
export const fetchReviewInfo = async (isEdit: boolean): Promise<ReviewInfo> => Promise.resolve(
    adjustReviewInfo(
        isEdit ? MockReviewEdit : MockReviewFull,
    ) as ReviewInfo,
)

/**
 * Create contact request
 *
 * @param challengeId challenge id
 * @param resourceId resource id
 * @param data request info
 * @returns resolves to the contact request info
 */
export const createContactRequest = async (
    challengeId: string,
    resourceId: string,
    data: FormContactManager,
): Promise<BackendContactRequest> => {
    const result = await xhrPostAsync<
        {
            resourceId: string
            challengeId: string
            message: string
        },
        BackendContactRequest
    >(`${EnvironmentConfig.REVIEW.REVIEW_API}/contact-requests`, {
        challengeId,
        message: data.category
            ? `${data.category}:${data.message}`
            : data.message,
        resourceId,
    })
    return result
}

/**
 * Fetch submissions
 *
 * @param page current page
 * @param perPage number of item per page
 * @param challengeId challenge id
 * @returns resolves to the array of submissions
 */
export const fetchSubmissions = async (
    page: number,
    perPage: number,
    challengeId: string,
): Promise<{
    data: BackendSubmission[]
    totalPages: number
}> => {
    const results = await xhrGetAsync<
        BackendResponseWithMeta<BackendSubmission[]>
    >(
        `${EnvironmentConfig.REVIEW.REVIEW_API}/api/submissions?${qs.stringify({
            challengeId,
            page,
            perPage,
        })}`,
    )
    return {
        data: results.data,
        totalPages: results.meta.totalPages,
    }
}

/**
 * Download submission file
 *
 * @param submissionId submission id
 * @returns resolves to the submission file
 */
export const downloadSubmissionFile = async (
    submissionId: string,
): Promise<Blob> => {
    const results = await xhrGetBlobAsync<Blob>(
        `${EnvironmentConfig.REVIEW.REVIEW_API}/api/submissions/${submissionId}/download`,
    )
    return results
}

/**
 * Fetch project results
 *
 * @param page current page
 * @param perPage number of item per page
 * @param challengeId challenge id
 * @returns resolves to the array of project results
 */
export const fetchProjectResults = async (
    page: number,
    perPage: number,
    challengeId: string,
): Promise<{
    data: ProjectResult[]
    totalPages: number
}> => {
    const results = await xhrGetAsync<
        BackendResponseWithMeta<BackendProjectResult[]>
    >(
        `${EnvironmentConfig.REVIEW.REVIEW_API}/projectResult?${qs.stringify({
            challengeId,
            page,
            perPage,
        })}`,
    )

    const dataHavePlacement: BackendProjectResult[] = []
    const dataNoPlacement: BackendProjectResult[] = []
    forEach(results.data, item => {
        if (item.placement) {
            dataHavePlacement.push(item)
        } else {
            dataNoPlacement.push(item)
        }
    })
    // move the project results with placement to the front
    const data = [
        ...orderBy(dataHavePlacement, ['placement'], ['asc']),
        ...dataNoPlacement,
    ]

    return {
        data: data.map(convertBackendProjectResultToProjectResult),
        totalPages: results.meta.totalPages,
    }
}
