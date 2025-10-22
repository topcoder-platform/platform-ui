/**
 * Reviews service
 */
import { EnvironmentConfig } from '~/config'
import { xhrDeleteAsync, xhrGetAsync } from '~/libs/core'

import {
    ApiV5ResponseSuccess,
    PaginatedResponseV6,
    SubmissionReviewSummation,
} from '../models'

const REVIEW_SUMMATIONS_PER_PAGE = 500

type ReviewSummationsResponse = PaginatedResponseV6<SubmissionReviewSummation>

/**
 * Fetch review summations of a challenge with pagination support
 * @param challengeId challenge id
 * @returns resolves to the review summation list
 */
export const fetchReviewSummations = async (
    challengeId: string,
): Promise<SubmissionReviewSummation[]> => {
    if (!challengeId) {
        return Promise.resolve([])
    }

    const reviewSummations: SubmissionReviewSummation[] = []

    const makeQuery = (page: number): string => {
        const base = `${EnvironmentConfig.API.V6}/reviewSummations`
        const params = new URLSearchParams({
            challengeId,
            page: String(page),
            perPage: String(REVIEW_SUMMATIONS_PER_PAGE),
        })

        return `${base}?${params.toString()}`
    }

    const firstResponse
        = await xhrGetAsync<ReviewSummationsResponse>(makeQuery(1))
    reviewSummations.push(...(firstResponse?.data ?? []))

    const totalPages = firstResponse?.totalPages ?? 1

    if (totalPages > 1) {
        const pages = Array.from({ length: totalPages - 1 }, (_, index) => index + 2)
        const responses = await Promise.all(
            pages.map(page => xhrGetAsync<ReviewSummationsResponse>(makeQuery(page))),
        )

        for (const response of responses) {
            reviewSummations.push(...(response?.data ?? []))
        }
    }

    return reviewSummations
}

/**
 * Remove the review summation
 * @param reviewSummationId the review summation id
 * @returns resolves to success or failure calling api
 */
export const removeReviewSummation = async (
    reviewSummationId: string,
): Promise<ApiV5ResponseSuccess> => {
    await xhrDeleteAsync<ApiV5ResponseSuccess>(
        `${EnvironmentConfig.API.V6}/reviewSummations/${reviewSummationId}`,
    )
    return {
        success: true,
    }
}

/**
 * Remove the review summations
 * @param reviewSummationIds the review summation id list
 * @returns resolves to success or failure calling api
 */
export const removeReviewSummations = async (
    reviewSummationIds: string[],
): Promise<ApiV5ResponseSuccess> => {
    for (const reviewSummationId of reviewSummationIds) {
        // eslint-disable-next-line no-await-in-loop
        await removeReviewSummation(reviewSummationId)
    }

    return {
        success: true,
    }
}
