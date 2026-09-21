/**
 * Minimal copilot opportunity shape consumed by the Work app.
 *
 * The Work app only links out to the Copilots app for opportunities that were
 * created from a project's copilot requests, so this model intentionally keeps
 * a narrow subset of the fields returned by
 * `GET /projects/copilots/opportunities`.
 */
export interface CopilotOpportunity {
    /** Opportunity identifier used to build the Copilots app deep link. */
    id: string
    /** Identifier of the copilot request the opportunity was created from. */
    copilotRequestId?: string
    /** ISO timestamp the opportunity was created at. */
    createdAt?: string
    /** Title captured on the originating copilot request. */
    opportunityTitle?: string
    /** Owning project identifier. */
    projectId?: string
    /** Opportunity lifecycle status, for example `active` or `completed`. */
    status?: string
    /** Opportunity type, for example `dev` or `design`. */
    type?: string
}
