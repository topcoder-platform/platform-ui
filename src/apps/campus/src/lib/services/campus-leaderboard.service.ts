/**
 * Read-only client for the campus leaderboard report.
 */
import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

import { CampusChallengeFilter, CampusLeaderboard } from '../models'

/**
 * Builds the campus leaderboard report url for a group and challenge filter.
 *
 * @param groupName group name taken from the route.
 * @param challengeFilter challenge visibility filter.
 * @returns absolute reports api url.
 */
export function campusLeaderboardUrl(
    groupName: string,
    challengeFilter: CampusChallengeFilter,
): string {
    const params: URLSearchParams = new URLSearchParams({ challengeFilter, groupName })
    return `${EnvironmentConfig.REPORTS_API}/topcoder/leaderboard/campus?${params.toString()}`
}

/**
 * Fetches the campus leaderboard for a group.
 *
 * @param url campus leaderboard report url.
 * @returns leaderboard payload.
 */
export async function fetchCampusLeaderboard(url: string): Promise<CampusLeaderboard> {
    return xhrGetAsync<CampusLeaderboard>(url)
}
