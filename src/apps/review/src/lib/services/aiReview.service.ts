import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

import { AiReviewConfig, AiReviewDecision } from '../models'

const v6BaseUrl = `${EnvironmentConfig.API.V6}`

export const getAiReviewConfigCacheKey = (challengeId?: string): string => (
    `${v6BaseUrl}/ai-review/configs/${challengeId ?? ''}`
)

export const fetchAiReviewConfig = async (challengeId: string): Promise<AiReviewConfig> => (
    xhrGetAsync<AiReviewConfig>(getAiReviewConfigCacheKey(challengeId))
)

export const getAiReviewDecisionsCacheKey = (configId?: string): string => (
    `${v6BaseUrl}/ai-review/decisions?configId=${configId ?? ''}`
)

export const fetchAiReviewDecisions = async (configId: string): Promise<AiReviewDecision[]> => (
    xhrGetAsync<AiReviewDecision[]>(getAiReviewDecisionsCacheKey(configId))
)
