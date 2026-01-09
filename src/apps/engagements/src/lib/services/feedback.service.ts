import { EnvironmentConfig } from '~/config'
import { getAsync, postAsync } from '~/libs/core'

import type {
    CreateFeedbackRequest,
    Feedback,
    GenerateFeedbackLinkRequest,
    GenerateFeedbackLinkResponse,
} from '../models'

const BASE_URL = `${EnvironmentConfig.API.V6}/engagements`

export const getFeedbackForEngagement = async (
    engagementId: string,
): Promise<Feedback[]> => (
    getAsync<Feedback[]>(`${BASE_URL}/${engagementId}/feedback`)
)

export const createFeedback = async (
    engagementId: string,
    data: CreateFeedbackRequest,
): Promise<Feedback> => postAsync<CreateFeedbackRequest, Feedback>(
    `${BASE_URL}/${engagementId}/feedback`,
    data,
)

export const generateFeedbackLink = async (
    engagementId: string,
    data: GenerateFeedbackLinkRequest,
): Promise<GenerateFeedbackLinkResponse> => (
    postAsync<GenerateFeedbackLinkRequest, GenerateFeedbackLinkResponse>(
        `${BASE_URL}/${engagementId}/feedback/generate-link`,
        data,
    )
)

export const submitAnonymousFeedback = async (
    secretToken: string,
    data: CreateFeedbackRequest,
): Promise<Feedback> => (
    postAsync<CreateFeedbackRequest & { secretToken: string }, Feedback>(
        `${EnvironmentConfig.API.V6}/feedback/anonymous`,
        {
            secretToken,
            ...data,
        },
    )
)
