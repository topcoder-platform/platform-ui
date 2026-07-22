import useSWR, { SWRResponse } from 'swr'

import {
    memberRoleChallengesURL,
    memberRoleStatsURL,
} from '../profile-functions'
import {
    MemberRoleChallenges,
    MemberRoleStats,
    MemberSpecialRole,
} from '../member-role-stats.model'

/**
 * Fetches the copilot and reviewer challenge totals for a member profile.
 *
 * Network failures are exposed through the returned SWR response rather than thrown by this hook.
 *
 * @param {string | undefined} handle - Member handle whose role totals should be loaded.
 * @returns {SWRResponse<MemberRoleStats, Error>} SWR state containing the role summary.
 */
export function useMemberRoleStats(handle?: string): SWRResponse<MemberRoleStats, Error> {
    return useSWR<MemberRoleStats, Error>(handle ? memberRoleStatsURL(handle) : undefined)
}

/**
 * Fetches every newest-first challenge for a member's special role.
 *
 * Network failures are exposed through the returned SWR response rather than thrown by this hook.
 *
 * @param {string | undefined} handle - Member handle whose role challenges should be loaded.
 * @param {MemberSpecialRole | undefined} role - Copilot or reviewer role to query.
 * @returns {SWRResponse<MemberRoleChallenges, Error>} SWR state for the complete challenge list.
 */
export function useMemberRoleChallenges(
    handle: string | undefined,
    role: MemberSpecialRole | undefined,
): SWRResponse<MemberRoleChallenges, Error> {
    const url = handle && role
        ? memberRoleChallengesURL(handle, role)
        : undefined

    return useSWR<MemberRoleChallenges, Error>(url, {
        shouldRetryOnError: false,
    })
}
