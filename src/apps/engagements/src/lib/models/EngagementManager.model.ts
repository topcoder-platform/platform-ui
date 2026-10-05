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

/**
 * Identity of the member being granted approval authority.
 *
 * `userId` is the authoritative field - authority is keyed on it. `handle` and `name` are display
 * values the caller already has from the member picker, sent so the API does not have to look the
 * member up again.
 */
export interface AssignEngagementManagerRequest {
    handle?: string
    name?: string
    userId: string
}
