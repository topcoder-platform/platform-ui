import { useEffect } from 'react'
import useSWR, { SWRResponse } from 'swr'

import { handleError } from '~/libs/shared/lib/utils/handle-error'

import {
    AiReviewEscalationDecision,
    AiReviewEscalationStatus,
    fetchAiReviewEscalations,
    getAiReviewEscalationsCacheKey,
} from '../services'

export interface AiReviewEscalationsResponse {
    decisions: AiReviewEscalationDecision[]
    isLoading: boolean
}

interface UseFetchAiReviewEscalationsArgs {
    challengeId?: string
    submissionId?: string
    aiReviewDecisionId?: string
    status?: AiReviewEscalationStatus
    submissionLocked?: boolean
}

export function useFetchAiReviewEscalations(
    args: UseFetchAiReviewEscalationsArgs,
): AiReviewEscalationsResponse {
    const cacheKey = getAiReviewEscalationsCacheKey({
        aiReviewDecisionId: args.aiReviewDecisionId,
        challengeId: args.challengeId,
        status: args.status,
        submissionId: args.submissionId,
        submissionLocked: args.submissionLocked,
    })

    const {
        data: decisions = [],
        error: fetchError,
        isValidating: isLoading,
    }: SWRResponse<AiReviewEscalationDecision[], Error> = useSWR<
        AiReviewEscalationDecision[],
        Error
    >(
        cacheKey,
        {
            fetcher: () => fetchAiReviewEscalations({
                aiReviewDecisionId: args.aiReviewDecisionId,
                challengeId: args.challengeId,
                status: args.status,
                submissionId: args.submissionId,
                submissionLocked: args.submissionLocked,
            }),
            isPaused: () => !args.challengeId && !args.submissionId && !args.aiReviewDecisionId,
        },
    )

    useEffect(() => {
        if (fetchError) {
            handleError(fetchError)
        }
    }, [fetchError])

    return {
        decisions,
        isLoading,
    }
}
