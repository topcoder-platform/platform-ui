import {
    adjustReviewItemComment,
    ReviewItemComment,
} from './ReviewItemComment.model'
import { BackendAppeal, convertBackendAppeal } from './BackendAppeal.model'

/**
 * Backend model for review item comment
 */
export type BackendReviewItemCommentType =
    | 'COMMENT'
    | 'REQUIRED'
    | 'RECOMMENDED'
    | 'AGGREGATION_COMMENT'
    | 'AGGREGATION_REVIEW_COMMENT'
    | 'SUBMITTER_COMMENT'
    | 'FINAL_FIX_COMMENT'
    | 'FINAL_REVIEW_COMMENT'
    | 'MANAGER_COMMENT'
    | 'APPROVAL_REVIEW_COMMENT'
    | 'APPROVAL_REVIEW_COMMENT_OTHER_FIXES'
    | 'SPECIFICATION_REVIEW_COMMENT'

export interface BackendReviewItemCommentBase {
    content: string
    type: BackendReviewItemCommentType
    sortOrder: number
}

export interface BackendReviewItemComment extends BackendReviewItemCommentBase {
    id: string
    createdAt: string
    createdBy: string
    updatedAt: string
    updatedBy: string
    appeal?: BackendAppeal
}

/**
 * Convert backend review item info to show in ui
 *
 * @param data data from backend response
 * @returns updated data
 */
export function convertBackendReviewItemComment(
    data: BackendReviewItemComment,
): ReviewItemComment {
    return adjustReviewItemComment({
        appeal: data.appeal ? convertBackendAppeal(data.appeal) : undefined,
        content: data.content === ' ' ? '' : data.content,
        id: data.id,
        sortOrder: data.sortOrder,
        type: data.type,
    })
}
