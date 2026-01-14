import { EnvironmentConfig } from '~/config'
import { xhrGetAsync, xhrPostAsync } from '~/libs/core'

import type {
    CreateFeedbackRequest,
    Feedback,
    GenerateFeedbackLinkRequest,
    GenerateFeedbackLinkResponse,
} from '../models'

const API_BASE_URL = `${EnvironmentConfig.API.V6}/engagements`
const ENGAGEMENTS_URL = `${API_BASE_URL}/engagements`
const FEEDBACK_URL = `${API_BASE_URL}/feedback`

export const getFeedbackForEngagement = async (
    engagementId: string,
): Promise<Feedback[]> => (
    xhrGetAsync<Feedback[]>(`${ENGAGEMENTS_URL}/${engagementId}/feedback`)
)

export const createFeedback = async (
    engagementId: string,
    data: CreateFeedbackRequest,
): Promise<Feedback> => xhrPostAsync<CreateFeedbackRequest, Feedback>(
    `${ENGAGEMENTS_URL}/${engagementId}/feedback`,
    data,
)

export const generateFeedbackLink = async (
    engagementId: string,
    data: GenerateFeedbackLinkRequest,
): Promise<GenerateFeedbackLinkResponse> => (
    xhrPostAsync<GenerateFeedbackLinkRequest, GenerateFeedbackLinkResponse>(
        `${ENGAGEMENTS_URL}/${engagementId}/feedback/generate-link`,
        data,
    )
)

export const submitAnonymousFeedback = async (
    secretToken: string,
    data: CreateFeedbackRequest,
): Promise<Feedback> => (
    xhrPostAsync<CreateFeedbackRequest & { secretToken: string }, Feedback>(
        `${FEEDBACK_URL}/anonymous`,
        {
            secretToken,
            ...data,
        },
    )
)
