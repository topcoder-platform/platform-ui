import { find, get } from 'lodash'

import { MemberStats, StatsHistory, UserStatsHistory, useStatsHistory } from '~/libs/core'

/**
 * Fetches the default history data for a track using its API path and name.
 *
 * @param {UserStatsHistory | undefined} statsHistory - Raw stats-history payload.
 * @param {MemberStats} trackData - The track data for which to fetch history.
 * @returns {StatsHistory[]} History rows for the displayed track.
 */
const getDefaultTrackHistory = (
    statsHistory: UserStatsHistory | undefined,
    trackData: MemberStats,
): StatsHistory[] => get(
    find(get(statsHistory, `${trackData.path}`, []), { name: trackData.name }),
    'history',
)
    // marathon match and some unified stats dimensions have a keyed history structure
    || get(
        statsHistory,
        `${trackData.path}.${trackData.name}.history`,
    ) || []

/**
 * Extracts the history rows for a displayed track.
 *
 * @param {UserStatsHistory | undefined} statsHistory - Raw stats-history payload.
 * @param {MemberStats | undefined} trackData - The track data for which to fetch history.
 * @returns {StatsHistory[]} History rows for the displayed track.
 */
export const getTrackHistoryFromStats = (
    statsHistory: UserStatsHistory | undefined,
    trackData?: MemberStats,
): StatsHistory[] => {
    if (!trackData) {
        return []
    }

    return getDefaultTrackHistory(statsHistory, trackData)
}

/**
 * Fetches the user stats history and extracts the history data for the specified track.
 *
 * @param {string | undefined} userHandle - User's handle.
 * @param {MemberStats | undefined} trackData - The track data for which to fetch history.
 * @returns {StatsHistory[]} History rows for the specified track.
 */
export const useTrackHistory = (userHandle?: string, trackData?: MemberStats): StatsHistory[] => {
    const statsHistory: UserStatsHistory | undefined = useStatsHistory(userHandle)

    return getTrackHistoryFromStats(statsHistory, trackData)
}
