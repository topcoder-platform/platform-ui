import { EnvironmentConfig } from '~/config'
import { xhrDeleteAsync, xhrGetAsync, xhrPostAsync } from '~/libs/core'

import type { AssignEngagementManagerRequest, EngagementManager } from '../models'

const ENGAGEMENTS_URL = `${EnvironmentConfig.API.V6}/engagements`

const managersUrl = (engagementId: string): string => (
    `${ENGAGEMENTS_URL}/${engagementId}/managers`
)

/**
 * Lists the engagement's current managers.
 *
 * Readable by an administrator, by a manager of the engagement, and by an assigned member, who needs
 * it because their own timesheet header lists their managers.
 */
export const getEngagementManagers = async (
    engagementId: string,
): Promise<EngagementManager[]> => (
    xhrGetAsync<EngagementManager[]>(managersUrl(engagementId))
)

/**
 * Grants a member timesheet approval authority on the engagement. Administrators only.
 *
 * The handle is validated server-side: it must belong to an active Topcoder member and must not
 * already be assigned. Re-assigning a previously removed manager reactivates that record rather than
 * creating a second one.
 */
export const assignEngagementManager = async (
    engagementId: string,
    handle: string,
): Promise<EngagementManager> => (
    xhrPostAsync<AssignEngagementManagerRequest, EngagementManager>(
        managersUrl(engagementId),
        { handle },
    )
)

/**
 * Revokes a manager's approval authority. Administrators only.
 *
 * The record is soft-deleted server-side so approvals this manager already made keep their
 * attribution.
 */
export const removeEngagementManager = async (
    engagementId: string,
    managerUserId: string,
): Promise<void> => {
    await xhrDeleteAsync(`${managersUrl(engagementId)}/${managerUserId}`)
}
