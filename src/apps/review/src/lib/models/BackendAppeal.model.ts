import { AppealInfo } from './AppealInfo.model'
import { BackendAppealResponse } from './BackendAppealResponse.model'

/**
 * Backend model for appeal
 */
export interface BackendAppealBase {
    reviewItemCommentId: string
    content: string
}

export interface BackendAppeal extends BackendAppealBase {
    resourceId: string
    id: string
    appealResponse?: BackendAppealResponse
    createdAt: string
    createdBy: string
    updatedAt: string
    updatedBy: string
}

/**
 * Convert backend review item info to show in ui
 *
 * @param data data from backend response
 * @returns updated data
 */
export function convertBackendAppeal(data: BackendAppeal): AppealInfo {
    return {
        appealResponse: data.appealResponse,
        content: data.content,
        id: data.id,
        reviewItemCommentId: data.reviewItemCommentId,
    }
}
