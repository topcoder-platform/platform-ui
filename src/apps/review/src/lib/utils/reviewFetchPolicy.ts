import type { BackendResource } from '../models'

import { PAST_CHALLENGE_STATUSES } from './challengeStatus'

const ADMIN_ROLE = 'Admin'
const COPILOT_ROLE = 'Copilot'
const MANAGER_ROLE = 'Manager'
const REVIEWER_ROLE = 'Reviewer'
const SUBMITTER_ROLE = 'Submitter'

/**
 * Determines whether challenge reviews should be fetched regardless of reviewer assignments.
 * Past challenges need the full review list even for observer-style views because legacy
 * submissions often do not embed their review rows locally.
 *
 * @param actionChallengeRole - Current challenge action role.
 * @param challengeStatus - Challenge status from challenge info.
 * @param myResources - Current member resources for the challenge.
 * @returns True when the UI should force the full challenge-review fetch.
 */
export function shouldForceChallengeReviewFetch(
    actionChallengeRole: string | undefined,
    challengeStatus: string | undefined,
    myResources?: BackendResource[],
): boolean {
    const normalizedStatus = (challengeStatus ?? '')
        .trim()
        .toUpperCase()

    if (
        normalizedStatus
        && PAST_CHALLENGE_STATUSES.some(status => normalizedStatus.startsWith(status))
    ) {
        return true
    }

    const normalizedActionRole = actionChallengeRole ?? ''

    if (
        normalizedActionRole === SUBMITTER_ROLE
        || normalizedActionRole === REVIEWER_ROLE
        || normalizedActionRole === COPILOT_ROLE
        || normalizedActionRole === ADMIN_ROLE
        || normalizedActionRole === MANAGER_ROLE
    ) {
        return true
    }

    return (myResources ?? []).some(resource => {
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
}
