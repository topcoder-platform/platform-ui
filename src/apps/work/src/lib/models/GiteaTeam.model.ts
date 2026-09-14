/**
 * A Gitea team challenge participants can be synced with.
 *
 * Team names are only unique within an organization, so a team is always shown
 * and stored together with the organization owning it.
 */
export interface GiteaTeam {
    /** Team description, when Gitea has one. */
    description?: string
    /** Numeric Gitea team id, the value the review API syncs membership with. */
    id: number
    /** Team name. */
    name: string
    /** Name of the Gitea organization owning the team. */
    organization: string
}
