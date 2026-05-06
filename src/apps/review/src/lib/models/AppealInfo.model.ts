import { BackendAppealResponse } from './BackendAppealResponse.model'

/**
 * AppealInfo
 */
export interface AppealInfo {
    id: string
    reviewItemCommentId: string
    content: string
    appealResponse?: BackendAppealResponse
}

export interface MappingAppeal {
    [reviewItemCommentId: string]: AppealInfo | undefined
}

export interface MappingReviewAppeal {
    [reviewId: string]: {
        totalAppeals: number
        finishAppeals: number
    }
}
