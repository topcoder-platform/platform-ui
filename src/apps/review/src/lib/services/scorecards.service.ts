/**
 * Scorecards service
 */
import { xhrPatchAsync, xhrPostAsync, xhrPutAsync } from '~/libs/core'
import { EnvironmentConfig } from '~/config'

import { Scorecard } from '../models'

const baseUrl = `${EnvironmentConfig.API.V6}/scorecards`

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

export const updateLikesOrDislikesOnRunItemComment = (
    workflowId: string,
    runId: string,
    feedbackId: string,
    commentId: string,
    body: {
        upVote: boolean
        downVote: boolean
    },
): Promise<void> => xhrPatchAsync(
    `${EnvironmentConfig.API.V6}/workflows/${workflowId}/runs/${runId}/items/${feedbackId}/comments/${commentId}`,
    body,
)
