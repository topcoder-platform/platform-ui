import { xhrGetAsync } from '~/libs/core'

import { REVIEWS_API_URL } from '../constants'
import { Review } from '../models'

function normalizeError(error: unknown, fallbackMessage: string): Error {
    const typedError = error as {
        message?: string
        response?: {
            data?: {
                message?: string
            }
        }
    }

    const errorMessage = typedError?.response?.data?.message
        || typedError?.message
        || fallbackMessage

    return new Error(errorMessage)
}

function normalizeReview(review: Partial<Review>): Review | undefined {
    const id = review.id !== undefined && review.id !== null
        ? String(review.id)
        : ''
    const resourceId = review.resourceId !== undefined && review.resourceId !== null
        ? String(review.resourceId)
        : ''

    if (!id || !resourceId) {
        return undefined
    }

    return {
        committed: review.committed === true,
        id,
        resourceId,
        status: typeof review.status === 'string'
            ? review.status
            : undefined,
    }
}

function extractReviews(response: unknown): Partial<Review>[] {
    if (Array.isArray(response)) {
        return response as Partial<Review>[]
    }

    if (typeof response !== 'object' || !response) {
        return []
    }

    const typedResponse = response as {
        data?: unknown
    }

    if (Array.isArray(typedResponse.data)) {
        return typedResponse.data as Partial<Review>[]
    }

    if (typeof typedResponse.data !== 'object' || !typedResponse.data) {
        return []
    }

    const nestedData = typedResponse.data as {
        data?: unknown
    }

    if (Array.isArray(nestedData.data)) {
        return nestedData.data as Partial<Review>[]
    }

    return []
}

export async function fetchReviews(challengeId: string): Promise<Review[]> {
    const normalizedChallengeId = challengeId.trim()

    if (!normalizedChallengeId) {
        return []
    }

    const query = new URLSearchParams({
        challengeId: normalizedChallengeId,
    })

    try {
        const response = await xhrGetAsync<unknown>(
            `${REVIEWS_API_URL}?${query.toString()}`,
        )

        return extractReviews(response)
            .map(review => normalizeReview(review))
            .filter((review): review is Review => !!review)
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch challenge reviews')
    }
}
