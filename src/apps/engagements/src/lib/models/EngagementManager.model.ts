/**
 * A manager authorized to approve timesheets on an engagement.
 *
 * Authority is per-engagement and comes only from this assignment - never from a platform role.
 * An engagement can have several managers, and any one of them may approve submitted hours.
 */
export interface EngagementManager {
    handle: string
    name: string | null
    userId: string
}

export interface AssignEngagementManagerRequest {
    handle: string
}
