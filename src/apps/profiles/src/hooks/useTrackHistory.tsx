import { find, get, orderBy, uniqBy } from 'lodash'

import { MemberStats, StatsHistory, UserStatsHistory, useStatsHistory } from '~/libs/core'

/**
 * Extracts the history array from an exact stats-history path.
 *
 * @param {UserStatsHistory | undefined} statsHistory - Raw stats-history payload.
 * @param {string} historyPath - Exact lodash path to a history array.
 * @returns {StatsHistory[]} History rows at the supplied path.
 */
const getHistoryFromExactPath = (
    statsHistory: UserStatsHistory | undefined,
    historyPath: string,
): StatsHistory[] => get(statsHistory, historyPath, [])

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
 * Some displayed tracks merge history from compatibility paths, such as
 * Development > Code reading Data Science Challenge history from the API.
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

    const trackHistory = getDefaultTrackHistory(statsHistory, trackData)
    const compatibilityHistory = (trackData.historyPaths ?? [])
        .flatMap(historyPath => getHistoryFromExactPath(statsHistory, historyPath))

    if (compatibilityHistory.length === 0) {
        return trackHistory
    }

    return orderBy(
        uniqBy(
            [
                ...trackHistory,
                ...compatibilityHistory,
            ],
            history => String(history.challengeId),
        ),
        [history => history.ratingDate ?? history.date ?? 0],
        ['desc'],
    )
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
