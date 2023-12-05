import { find, get } from 'lodash'

import { MemberStats, StatsHistory, UserStatsHistory, useStatsHistory } from '~/libs/core'

/**
 * Fetches the user stats history and extracts the history data for the specified track
 * @param userHandle - User's handle
 * @param trackData - The track data for which we want to fetch the history
 * @returns
 */
export const useTrackHistory = (userHandle?: string, trackData?: MemberStats): StatsHistory[] => {
    const statsHistory: UserStatsHistory | undefined = useStatsHistory(userHandle)

    if (!trackData) {
        return []
    }

    const trackHistory: StatsHistory[] = get(
        find(get(statsHistory, `${trackData.path}`, []), { name: trackData.name }),
        'history',
    )
    // marathon match has a different structure for the stats history
    || get(
        statsHistory,
        `${trackData.path}.${trackData.name}.history`,
    ) || []

    return trackHistory
}
