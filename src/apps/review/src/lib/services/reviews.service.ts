/**
 * Reviews service
 */
import qs from 'qs'

import { EnvironmentConfig } from '~/config'
import { xhrGetPaginatedAsync, xhrPostAsync } from '~/libs/core'

import {
    adjustReviewInfo,
    BackendChallengeInfo,
    BackendContactRequest,
    ChallengeInfo,
    convertBackendChallengeInfo,
    FormContactManager,
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
            ...(challengeTypeId
                ? {
                    typeId: challengeTypeId,
                }
                : {}),
            ...(challengeTrackId
                ? {
                    trackId: challengeTrackId,
                }
                : {}),
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
