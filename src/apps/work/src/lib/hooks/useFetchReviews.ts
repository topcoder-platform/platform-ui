import useSWR, { SWRResponse } from 'swr'

import { Review } from '../models'
import { fetchReviews } from '../services'

export interface UseFetchReviewsResult {
    error: Error | undefined
    isError: boolean
    isLoading: boolean
    mutate: SWRResponse<Review[], Error>['mutate']
    reviews: Review[]
}

export function useFetchReviews(challengeId?: string): UseFetchReviewsResult {
    const swrKey = challengeId
        ? [
            'reviews',
            challengeId,
        ]
        : undefined

    const {
        data,
        error,
        mutate,
    }: SWRResponse<Review[], Error>
        = useSWR<Review[], Error>(
            swrKey,
            () => fetchReviews(challengeId as string),
            {
                errorRetryCount: 2,
                shouldRetryOnError: true,
            },
        )

    return {
        error,
        isError: !!error,
        isLoading: !!challengeId && !data && !error,
        mutate,
        reviews: data || [],
    }
}
