/**
 * Backend request for review item
 */

import { BackendRequestReviewItemComment } from './BackendRequestReviewItemComment.model'
import { BackendReviewItemBase } from './BackendReviewItem.model'

export interface BackendRequestReviewItem extends BackendReviewItemBase {
    reviewItemComments?: BackendRequestReviewItemComment[]
}
