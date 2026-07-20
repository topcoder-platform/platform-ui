import useSWR, { SWRResponse } from 'swr'

import {
    memberRoleChallengesURL,
    memberRoleStatsURL,
} from '../profile-functions'
import {
    MemberRoleChallengesPage,
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
 * Fetches one newest-first page of challenges for a member's special role.
 *
 * Network failures are exposed through the returned SWR response rather than thrown by this hook.
 *
 * @param {string | undefined} handle - Member handle whose role challenges should be loaded.
 * @param {MemberSpecialRole | undefined} role - Copilot or reviewer role to query.
 * @param {number} page - One-based page number.
 * @param {number} perPage - Number of challenges per page, capped by the API at 100.
 * @returns {SWRResponse<MemberRoleChallengesPage, Error>} SWR state for the requested challenge page.
 */
export function useMemberRoleChallenges(
    handle: string | undefined,
    role: MemberSpecialRole | undefined,
    page: number,
    perPage: number = 100,
): SWRResponse<MemberRoleChallengesPage, Error> {
    const url = handle && role
        ? memberRoleChallengesURL(handle, role, page, perPage)
        : undefined

    return useSWR<MemberRoleChallengesPage, Error>(url)
}
