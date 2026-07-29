import type { BackendResource } from '../models'

const ADMIN_ROLE = 'Admin'
const COPILOT_ROLE = 'Copilot'
const MANAGER_ROLE = 'Manager'
const REVIEWER_ROLE = 'Reviewer'
const SUBMITTER_ROLE = 'Submitter'

/**
 * Determines whether challenge reviews should be fetched regardless of reviewer assignments.
 * An explicit review-capable challenge role is required; past challenge status alone never
 * authorizes an observer or unresolved role context to request protected review data. Ordinary
 * Submitters additionally need a visible owned submission, except for the established Task
 * challenge assignment flow.
 *
 * @param actionChallengeRole - Current challenge action role.
 * @param challengeStatus - Challenge status from challenge info. A missing status delays the
 * request until challenge context has resolved.
 * @param myResources - Current member resources for the challenge.
 * @param hasVisibleSubmissions - Whether the current viewer has at least one locally visible
 * submission. Ordinary Submitters without one cannot access review data and do not need it for
 * winner downloads.
 * @param allowSubmitterWithoutVisibleSubmissions - Whether the challenge explicitly permits an
 * assigned Submitter to access reviews without a submission, as Task challenges do.
 * @returns True when the UI should force the full challenge-review fetch.
 * @throws Does not throw.
 */
export function shouldForceChallengeReviewFetch(
    actionChallengeRole: string | undefined,
    challengeStatus: string | undefined,
    myResources?: BackendResource[],
    hasVisibleSubmissions: boolean = true,
    allowSubmitterWithoutVisibleSubmissions: boolean = false,
): boolean {
    const normalizedActionRole = actionChallengeRole ?? ''

    if (
        normalizedActionRole === SUBMITTER_ROLE
        && !hasVisibleSubmissions
        && !allowSubmitterWithoutVisibleSubmissions
    ) {
        return false
    }

    const normalizedStatus = (challengeStatus ?? '')
        .trim()
        .toUpperCase()
    if (!normalizedStatus) {
        return false
    }

    const hasEligibleActionRole = (
        normalizedActionRole === SUBMITTER_ROLE
        || normalizedActionRole === REVIEWER_ROLE
        || normalizedActionRole === COPILOT_ROLE
        || normalizedActionRole === ADMIN_ROLE
        || normalizedActionRole === MANAGER_ROLE
    )
    const hasEligibleResourceRole = (myResources ?? []).some(resource => {
        const normalizedRoleName = (resource.roleName ?? '').toLowerCase()

        if (!normalizedRoleName) {
            return false
        }

        return normalizedRoleName.includes('screener')
            || normalizedRoleName.includes('reviewer')
            || normalizedRoleName.includes('copilot')
            || normalizedRoleName.includes('admin')
            || normalizedRoleName.includes('manager')
    })

    return hasEligibleActionRole || hasEligibleResourceRole
}
