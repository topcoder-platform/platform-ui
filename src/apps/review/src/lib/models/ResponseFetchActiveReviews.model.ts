import { BackendMyReviewAssignment } from './BackendMyReviewAssignment.model'
import { BackendResponseWithMeta } from './BackendResponseWithMeta.model'

/**
 * Response for fetch active review assignments.
 * Includes pagination metadata when requesting paginated results.
 */
export type ResponseFetchActiveReviews = BackendResponseWithMeta<BackendMyReviewAssignment[]>
