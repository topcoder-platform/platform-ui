import {
    BackendReviewItemComment,
    convertBackendReviewItemComment,
} from './BackendReviewItemComment.model'
import { adjustReviewItemInfo, ReviewItemInfo } from './ReviewItemInfo.model'

/**
 * Backend model for review item
 */
export interface BackendReviewItemBase {
    scorecardQuestionId: string
    initialAnswer: string
    finalAnswer?: string
    managerComment?: string
}

export interface BackendReviewItem extends BackendReviewItemBase {
    id: string
    createdAt: string
    createdBy: string
    updatedAt: string
    updatedBy: string
    reviewItemComments?: BackendReviewItemComment[]
}

/**
 * Convert backend review item info to show in ui
 *
 * @param data data from backend response
 * @returns updated data
 */
export function convertBackendReviewItem(
    data: BackendReviewItem,
): ReviewItemInfo {
    return adjustReviewItemInfo({
        createdAt: data.createdAt,
        finalAnswer: (data.finalAnswer ?? '').trim(),
        id: data.id,
        initialAnswer: (data.initialAnswer ?? '').trim(),
        managerComment: data.managerComment,
        reviewItemComments:
            data.reviewItemComments && data.reviewItemComments.length > 0
                ? data.reviewItemComments.map(convertBackendReviewItemComment)
                : [
                    {
                        content: '',
                        id: '',
                        sortOrder: 0,
                        type: '',
                    },
                ],
        scorecardQuestionId: data.scorecardQuestionId,
    })
}
