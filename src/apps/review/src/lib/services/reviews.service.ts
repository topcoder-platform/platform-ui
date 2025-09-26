/**
 * Reviews service
 */
import { forEach, orderBy } from 'lodash'
import qs from 'qs'

import { EnvironmentConfig } from '~/config'
import {
    xhrDeleteAsync,
    xhrGetAsync,
    xhrGetBlobAsync,
    xhrPatchAsync,
    xhrPostAsync,
} from '~/libs/core'

import {
    adjustBackendSubmission,
    AppealInfo,
    BackendAppeal,
    BackendAppealResponse,
    BackendContactRequest,
    BackendMyReviewAssignment,
    BackendProjectResult,
    BackendRequestAppeal,
    BackendRequestAppealResponse,
    BackendRequestReview,
    BackendRequestReviewItem,
    BackendRequestReviewPatch,
    BackendResponseWithMeta,
    BackendReview,
    BackendReviewItem,
    BackendScorecard,
    BackendSubmission,
    convertBackendAppeal,
    convertBackendProjectResultToProjectResult,
    convertBackendScorecard,
    FormContactManager,
    ProjectResult,
    ScorecardInfo,
} from '../models'

const challengeBaseUrl = `${EnvironmentConfig.API.V6}`

/**
 * Fetch active review assignments for the current member.
 *
 * @param params optional filter and pagination params
 * @returns resolves to the array of active review assignments
 */
export interface FetchActiveReviewsParams {
    challengeTypeId?: string
    page?: number
    perPage?: number
}

export const fetchActiveReviews = async ({
    challengeTypeId,
    page,
    perPage,
}: FetchActiveReviewsParams = {}): Promise<BackendResponseWithMeta<BackendMyReviewAssignment[]>> => {
    const queryString = qs.stringify(
        {
            ...(challengeTypeId ? { challengeTypeId } : {}),
            ...(page ? { page } : {}),
            ...(perPage ? { perPage } : {}),
        },
        { addQueryPrefix: true },
    )

    return xhrGetAsync<BackendResponseWithMeta<BackendMyReviewAssignment[]>>(
        `${challengeBaseUrl}/my-reviews${queryString}`,
    )
}

/**
 * Fetch past review assignments for the current member.
 *
 * @param params optional filter and pagination params
 * @returns resolves to the array of past review assignments
 */
export interface FetchPastReviewsParams {
    challengeTypeId?: string
    page?: number
    perPage?: number
}

export const fetchPastReviews = async ({
    challengeTypeId,
    page,
    perPage,
}: FetchPastReviewsParams = {}): Promise<BackendResponseWithMeta<BackendMyReviewAssignment[]>> => {
    const queryString = qs.stringify(
        {
            ...(challengeTypeId ? { challengeTypeId } : {}),
            ...(page ? { page } : {}),
            ...(perPage ? { perPage } : {}),
            past: true,
        },
        { addQueryPrefix: true },
    )

    return xhrGetAsync<BackendResponseWithMeta<BackendMyReviewAssignment[]>>(
        `${challengeBaseUrl}/my-reviews${queryString}`,
    )
}

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
    >(`${EnvironmentConfig.API.V6}/contact-requests`, {
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
): Promise<BackendSubmission[]> => {
    const results = await xhrGetAsync<
        BackendResponseWithMeta<BackendSubmission[]>
    >(
        `${EnvironmentConfig.API.V6}/submissions?${qs.stringify({
            challengeId,
            page,
            perPage,
        })}`,
    )
    return results.data.map(item => adjustBackendSubmission(item))
}

/**
 * Fetch submission
 *
 * @param submissionId submission id
 * @returns resolves to the submission info
 */
export const fetchSubmission = async (
    submissionId: string,
): Promise<BackendSubmission> => {
    const results = await xhrGetAsync<
        BackendSubmission
    >(
        `${EnvironmentConfig.API.V6}/submissions/${submissionId}`,
    )
    return adjustBackendSubmission(results)
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
        `${EnvironmentConfig.API.V6}/submissions/${submissionId}/download`,
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
        `${EnvironmentConfig.API.V6}/review/projectResult?${qs.stringify({
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

/**
 * Fetch reviews
 *
 * @param page current page
 * @param perPage number of item per page
 * @param challengeId challenge id
 * @param submissionId submission id
 * @returns resolves to the array of reviews
 */
export const fetchReviews = async (
    page: number,
    perPage: number,
    challengeId: string,
    submissionId: string,
): Promise<BackendReview[]> => {
    const results = await xhrGetAsync<
        BackendResponseWithMeta<BackendReview[]>
    >(
        `${EnvironmentConfig.API.V6}/reviews?${qs.stringify({
            challengeId,
            page,
            perPage,
            submissionId,
        })}`,
    )
    return results.data
}

/**
 * Fetch challenge reviews
 *
 * @param challengeId challenge id
 * @param page current page
 * @param perPage number of items per page
 * @returns resolves to the array of reviews for the challenge
 */
export const fetchChallengeReviews = async (
    challengeId: string,
    page = 1,
    perPage = 1000,
): Promise<BackendReview[]> => {
    const results = await xhrGetAsync<
        BackendResponseWithMeta<BackendReview[]>
    >(
        `${EnvironmentConfig.API.V6}/reviews?${qs.stringify({
            challengeId,
            page,
            perPage,
        })}`,
    )
    return results.data
}

/**
 * Fetch appeals
 *
 * @param page current page
 * @param perPage number of item per page
 * @param resourceId resource id
 * @returns resolves to the array of appeals
 */
export const fetchAppeals = async (
    page: number,
    perPage: number,
    resourceId: string,
): Promise<AppealInfo[]> => {
    const results = await xhrGetAsync<
        BackendResponseWithMeta<BackendAppeal[]>
    >(
        `${EnvironmentConfig.API.V6}/appeals?${qs.stringify({
            page,
            perPage,
            resourceId,
        })}`,
    )
    return results.data.map(convertBackendAppeal)
}

/**
 * Fetch appeals with review id
 *
 * @param page current page
 * @param perPage number of item per page
 * @param reviewId resource id
 * @returns resolves to the array of appeals
 */
export const fetchAppealsWithReviewId = async (
    page: number,
    perPage: number,
    reviewId: string,
): Promise<AppealInfo[]> => {
    const results = await xhrGetAsync<
        BackendResponseWithMeta<BackendAppeal[]>
    >(
        `${EnvironmentConfig.API.V6}/appeals?${qs.stringify({
            page,
            perPage,
            reviewId,
        })}`,
    )
    return results.data.map(convertBackendAppeal)
}

/**
 * Create review
 *
 * @param data review data
 * @returns resolves to the review info
 */
export const createReview = async (
    data: BackendRequestReview,
): Promise<BackendReview> => {
    const result = await xhrPostAsync<
        BackendRequestReview,
        BackendReview
    >(`${EnvironmentConfig.API.V6}/reviews`, data)
    return result
}

/**
 * Update review
 *
 * @param reviewId review id
 * @param data review data
 * @returns resolves to the review info
 */
export const updateReview = async (
    reviewId: string,
    data: BackendRequestReviewPatch,
): Promise<BackendReview> => {
    const result = await xhrPatchAsync<
        BackendRequestReviewPatch,
        BackendReview
    >(`${EnvironmentConfig.API.V6}/reviews/${reviewId}`, data)
    return result
}

/**
 * Update review item
 *
 * @param reviewItemId review item id
 * @param data review item data
 * @returns resolves to the review item info
 */
export const updateReviewItem = async (
    reviewItemId: string,
    data: BackendRequestReviewItem,
): Promise<BackendReviewItem> => {
    const result = await xhrPatchAsync<
        BackendRequestReviewItem,
        BackendReviewItem
    >(`${EnvironmentConfig.API.V6}/reviews/items/${reviewItemId}`, data)
    return result
}

/**
 * Create appeal
 *
 * @param data appeal data
 * @returns resolves to the appeal info
 */
export const createAppeal = async (
    data: BackendRequestAppeal,
): Promise<BackendAppeal> => {
    const result = await xhrPostAsync<
        BackendRequestAppeal,
        BackendAppeal
    >(`${EnvironmentConfig.API.V6}/appeals`, data)
    return result
}

/**
 * Update appeal
 *
 * @param appealId appeal id
 * @param data appeal data
 * @returns resolves to the appeal info
 */
export const updateAppeal = async (
    appealId: string,
    data: BackendRequestAppeal,
): Promise<BackendAppeal> => {
    const result = await xhrPatchAsync<
        BackendRequestAppeal,
        BackendAppeal
    >(`${EnvironmentConfig.API.V6}/appeals/${appealId}`, data)
    return result
}

/**
 * Delete appeal
 *
 * @param appealId appeal id
 * @returns resolves to void
 */
export const deleteAppeal = async (
    appealId: string,
): Promise<void> => {
    const result = await xhrDeleteAsync<void>(`${EnvironmentConfig.API.V6}/appeals/${appealId}`)
    return result
}

/**
 * Create appeal response
 *
 * @param appealId appeal id
 * @param data appeal response data
 * @returns resolves to the appeal response info
 */
export const createAppealResponse = async (
    appealId: string,
    data: BackendRequestAppealResponse,
): Promise<BackendAppealResponse> => {
    const result = await xhrPostAsync<
        BackendRequestAppealResponse,
        BackendAppealResponse
    >(`${EnvironmentConfig.API.V6}/appeals/${appealId}/response`, data)
    return result
}

/**
 * Update appeal response
 *
 * @param appealResponseId appeal response id
 * @param data appeal response data
 * @returns resolves to the appeal response info
 */
export const updateAppealResponse = async (
    appealResponseId: string,
    data: BackendRequestAppealResponse,
): Promise<BackendAppealResponse> => {
    const result = await xhrPostAsync<
        BackendRequestAppealResponse,
        BackendAppealResponse
    >(`${EnvironmentConfig.API.V6}/appeals/response/${appealResponseId}`, data)
    return result
}

/**
 * Fetch scorecard
 *
 * @param scorecardId scorecard id
 * @returns resolves to the scorecard info
 */
export const fetchScorecard = async (
    scorecardId: string,
): Promise<ScorecardInfo> => {
    const results = await xhrGetAsync<BackendScorecard>(
        `${EnvironmentConfig.API.V6}/scorecards/${scorecardId}`,
    )
    return convertBackendScorecard(results)
}
