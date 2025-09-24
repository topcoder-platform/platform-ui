/**
 * Reviews service
 */
import { EnvironmentConfig } from '~/config'
import { xhrDeleteAsync } from '~/libs/core'

import { ApiV5ResponseSuccess } from '../models'

/**
 * Remove the review summation
 * @param reviewSummationId the review summation id
 * @returns resolves to success or failure calling api
 */
export const removeReviewSummation = async (
    reviewSummationId: string,
): Promise<ApiV5ResponseSuccess> => {
    await xhrDeleteAsync<ApiV5ResponseSuccess>(
        `${EnvironmentConfig.API.V5}/reviewSummations/${reviewSummationId}`,
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
