import { find, get } from 'lodash'

import { MemberStats, StatsHistory, UserStatsHistory, useStatsHistory } from '~/libs/core'

const AI_ENGINEERING_HISTORY_NAMES = [
    'AI Engineering',
    'AI',
    'AI_ENGINEER',
    'AI_ENGINEERING',
]

const AI_ENGINEERING_TRACK_TOKENS = new Set([
    'AI',
    'AI_ENGINEER',
    'AI_ENGINEERING',
])

const AI_ENGINEERING_HISTORY_PATHS = [
    'DATA_SCIENCE',
    'DEVELOP.subTracks',
    'AI_ENGINEERING',
    'AI',
    'AI_ENGINEER',
]

/**
 * Normalizes a track or rating path name for alias comparison.
 *
 * @param {string | undefined} value - Raw track, subtrack, or configured rating path name.
 * @returns {string} Uppercase underscore-delimited token.
 */
const normalizeTrackToken = (value?: string): string => (
    value?.trim()
        .toUpperCase()
        .replace(/[\s-]+/g, '_') ?? ''
)

/**
 * Checks whether a displayed stats subtrack represents AI Engineering.
 *
 * @param {MemberStats} trackData - Displayed subtrack data from the member stats payload.
 * @returns {boolean} Whether the subtrack should use AI Engineering history aliases.
 */
const isAIEngineeringTrackData = (trackData: MemberStats): boolean => (
    AI_ENGINEERING_TRACK_TOKENS.has(normalizeTrackToken(trackData.name))
    || AI_ENGINEERING_TRACK_TOKENS.has(normalizeTrackToken(trackData.parentTrack))
)

/**
 * Returns a history array only when it contains challenge rows.
 *
 * @param {StatsHistory[] | undefined} history - Candidate history rows.
 * @returns {StatsHistory[] | undefined} Non-empty history rows, otherwise undefined.
 */
const getNonEmptyHistory = (history?: StatsHistory[]): StatsHistory[] | undefined => (
    Array.isArray(history) && history.length > 0 ? history : undefined
)

/**
 * Reads the first non-empty history array from keyed or subtrack-based paths.
 *
 * @param {UserStatsHistory | undefined} statsHistory - Raw stats-history payload.
 * @param {string[]} paths - Candidate API paths that may contain history.
 * @param {string[]} trackNames - Candidate subtrack or rating path names.
 * @returns {StatsHistory[] | undefined} First matching history rows.
 */
const getFirstMatchingHistory = (
    statsHistory: UserStatsHistory | undefined,
    paths: string[],
    trackNames: string[],
): StatsHistory[] | undefined => {
    for (const path of paths) {
        const subTracks = get(statsHistory, path)

        if (Array.isArray(subTracks)) {
            const history = getNonEmptyHistory(
                find(subTracks, subTrack => trackNames.includes(subTrack.name))?.history,
            )

            if (history) {
                return history
            }
        }

        for (const trackName of trackNames) {
            const history = getNonEmptyHistory(get(statsHistory, `${path}.${trackName}.history`))

            if (history) {
                return history
            }
        }
    }

    return undefined
}

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
): StatsHistory[] => (
    getFirstMatchingHistory(statsHistory, [trackData.path ?? ''], [trackData.name]) ?? []
)

/**
 * Reads AI Engineering history across the API aliases used before and after
 * the profile hierarchy moved AI Engineering under Development.
 *
 * @param {UserStatsHistory | undefined} statsHistory - Raw stats-history payload.
 * @param {MemberStats} trackData - Displayed AI Engineering subtrack data.
 * @returns {StatsHistory[]} AI Engineering challenge history rows.
 */
const getAIEngineeringTrackHistory = (
    statsHistory: UserStatsHistory | undefined,
    trackData: MemberStats,
): StatsHistory[] => (
    getFirstMatchingHistory(
        statsHistory,
        [
            trackData.path,
            ...AI_ENGINEERING_HISTORY_PATHS,
        ].filter((path): path is string => !!path),
        AI_ENGINEERING_HISTORY_NAMES,
    ) ?? []
)

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

    const defaultHistory = getDefaultTrackHistory(statsHistory, trackData)

    return defaultHistory.length > 0 || !isAIEngineeringTrackData(trackData)
        ? defaultHistory
        : getAIEngineeringTrackHistory(statsHistory, trackData)
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
