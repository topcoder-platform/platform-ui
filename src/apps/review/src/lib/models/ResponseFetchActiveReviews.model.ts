import { BackendMyReviewAssignment } from './BackendMyReviewAssignment.model'

/**
 * Response for fetch active review assignments.
 * The endpoint returns a flat list without pagination metadata.
 */
export type ResponseFetchActiveReviews = BackendMyReviewAssignment[]
