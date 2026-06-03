import { useEffect } from 'react'
import useSWR, { SWRResponse } from 'swr'

import { handleError } from '~/libs/shared/lib/utils/handle-error'

import { AiReviewConfig, AiReviewDecision } from '../models'
import {
    fetchAiReviewConfig,
    fetchAiReviewDecisions,
    getAiReviewConfigCacheKey,
    getAiReviewDecisionsCacheKey,
} from '../services'

interface ErrorWithStatus {
    status?: number
    response?: {
        status?: number
    }
}

function isNotFoundError(error: unknown): boolean {
    const knownError = error as ErrorWithStatus | undefined
    return knownError?.status === 404 || knownError?.response?.status === 404
}

export interface UseFetchAiReviewConfigResult {
    aiReviewConfig?: AiReviewConfig
    isLoading: boolean
}

export function useFetchAiReviewConfig(challengeId?: string): UseFetchAiReviewConfigResult {
    const {
        data: aiReviewConfig,
        error,
        isValidating: isLoading,
    }: SWRResponse<AiReviewConfig | undefined, Error> = useSWR<AiReviewConfig | undefined, Error>(
        getAiReviewConfigCacheKey(challengeId),
        {
            fetcher: async (): Promise<AiReviewConfig | undefined> => {
                if (!challengeId) {
                    return undefined
                }

                try {
                    return await fetchAiReviewConfig(challengeId)
                } catch (fetchError) {
                    if (isNotFoundError(fetchError)) {
                        return undefined
                    }

                    throw fetchError
                }
            },
            isPaused: () => !challengeId,
        },
    )

    useEffect(() => {
        if (error) {
            handleError(error)
        }
    }, [error])

    return {
        aiReviewConfig,
        isLoading,
    }
}

export interface UseFetchAiReviewDecisionsResult {
    decisions: AiReviewDecision[]
    isLoading: boolean
}

export function useFetchAiReviewDecisions(configId?: string): UseFetchAiReviewDecisionsResult {
    const {
        data: decisions = [],
        error,
        isValidating: isLoading,
    }: SWRResponse<AiReviewDecision[], Error> = useSWR<AiReviewDecision[], Error>(
        getAiReviewDecisionsCacheKey(configId),
        {
            fetcher: async (): Promise<AiReviewDecision[]> => {
                if (!configId) {
                    return []
                }

                return fetchAiReviewDecisions(configId)
            },
            isPaused: () => !configId,
        },
    )

    useEffect(() => {
        if (error) {
            handleError(error)
        }
    }, [error])

    return {
        decisions,
        isLoading,
    }
}
