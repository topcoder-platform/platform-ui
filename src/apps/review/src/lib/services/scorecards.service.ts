/**
 * Scorecards service
 */
import {
    xhrGetAsync,
    xhrPatchAsync,
    xhrPostAsync,
    xhrPutAsync,
} from '~/libs/core'
import { EnvironmentConfig } from '~/config'

import { Scorecard } from '../models'

const baseUrl = `${EnvironmentConfig.API.V6}/scorecards`
const PAGE_SIZE = 20

export interface FetchScorecardsParams {
    page: number
    perPage?: number
    name?: string
    challengeTrack?: string
    scorecardType?: string
    challengeType?: string
    status?: string
}

export interface ScorecardsResponse {
    scoreCards: Scorecard[]
    metadata: any
}

/**
 * Fetches scorecards using the shared review lookup contract.
 *
 * @param params Scorecard filter and pagination inputs.
 * @returns Normalized scorecard list with metadata.
 */
export const fetchScorecards = async (
    {
        page,
        perPage = PAGE_SIZE,
        name = '',
        challengeTrack = '',
        challengeType = '',
        scorecardType = '',
        status = '',
    }: FetchScorecardsParams,
): Promise<ScorecardsResponse> => {
    const query = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
        ...(name ? { name } : {}),
        ...(scorecardType ? { scorecardType } : {}),
        ...(challengeTrack ? { challengeTrack } : {}),
        ...(challengeType ? { challengeType } : {}),
        ...(status ? { status } : {}),
    })

    const data = await xhrGetAsync<ScorecardsResponse>(`${baseUrl}?${query.toString()}`)

    return {
        metadata: data?.metadata,
        scoreCards: data?.scoreCards?.map(scorecard => ({
            ...scorecard,
            minimumPassingScore: scorecard.minimumPassingScore ?? 50,
        })) || [],
    }
}

/**
 * Clone scorecard
 * @param scorecard Scorecard to clone
 * @returns resolves to the cloned scorecard info
 */
export const cloneScorecard = async (scorecard: Pick<Scorecard, 'id'>): Promise<Scorecard> => (
    xhrPostAsync(`${baseUrl}/${scorecard.id}/clone`, {})
)

/**
 * Save scorecard
 * @param scorecard Scorecard data to save
 * @returns resolves to the saved scorecard data
 */
export const saveScorecard = async (scorecard: Scorecard): Promise<Scorecard> => {
    if (!scorecard.id) {
        return xhrPostAsync<Scorecard, Scorecard>(`${baseUrl}`, scorecard)
    }

    return xhrPutAsync<Scorecard, Scorecard>(`${baseUrl}/${scorecard.id}`, scorecard)
}

export const updateLikesOrDislikesOnRunItem = (
    workflowId: string,
    runId: string,
    feedbackId: string,
    body: {
        upVote: boolean
        downVote: boolean
    },
): Promise<void> => xhrPatchAsync(
    `${EnvironmentConfig.API.V6}/workflows/${workflowId}/runs/${runId}/items/${feedbackId}`,
    body,
)

export const updateRunItemComment = (
    workflowId: string,
    runId: string,
    feedbackId: string,
    commentId: string,
    body: {
        content?: string
        upVote?: boolean
        downVote?: boolean
    },
): Promise<void> => xhrPatchAsync(
    `${EnvironmentConfig.API.V6}/workflows/${workflowId}/runs/${runId}/items/${feedbackId}/comments/${commentId}`,
    body,
)

export const createFeedbackComment = (
    workflowId: string,
    runId: string,
    feedbackId: string,
    body: {
        content: string
        parentId?: string
    },
): Promise<void> => xhrPostAsync(
    `${EnvironmentConfig.API.V6}/workflows/${workflowId}/runs/${runId}/items/${feedbackId}/comments`,
    body,
)
