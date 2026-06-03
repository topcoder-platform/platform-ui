import { useMemo } from 'react'
import { filter, find, get, orderBy } from 'lodash'

import { MemberStats, SRMStats, useMemberStats, UserStats } from '~/libs/core'

import { calcProportionalAverage } from '../lib/math.utils'

const testingSubTrackNames = new Set([
    'BUG_HUNT',
    'TEST_SCENARIOS',
    'TEST_SUITES',
])

/**
 * The structure of a track for a member.
 */
export interface MemberStatsTrack {
    challenges?: number,
    isActive: boolean,
    name: string,
    submissions?: number,
    subTracks: MemberStats[],
    rating?: number,
    percentile?: number,
    submissionRate?: number
    screeningSuccessRate?: number
    wins: number,
    order?: number
    isDSTrack?: boolean
    isCPTrack?: boolean
}

/**
 * Return the explicit submission count when the stats payload includes one.
 *
 * Legacy stats include submission counters, while unified stats may omit them.
 *
 * @param {MemberStats | undefined} subTrack - The subtrack to inspect.
 * @returns {number | undefined} The submission count when available.
 */
export const getSubTrackSubmissionCount = (subTrack?: MemberStats): number | undefined => {
    const submissionCount = subTrack?.submissions?.submissions ?? subTrack?.submissions

    return typeof submissionCount === 'number' ? submissionCount : undefined
}

/**
 * Determine whether the subtrack should be considered active.
 *
 * Unified member stats do not currently include legacy submission counters for
 * development/design rows, so fall back to the challenge count when the
 * submission count is unavailable.
 *
 * @param {MemberStats | undefined} subTrack - The subtrack to inspect.
 * @returns {boolean} Whether the subtrack has activity worth rendering.
 */
const isActiveSubTrack = (subTrack?: MemberStats): boolean => {
    const submissionCount = getSubTrackSubmissionCount(subTrack)

    return (submissionCount ?? subTrack?.challenges ?? 0) > 0
}

/**
 * Determine whether the subtrack belongs in the legacy Testing track.
 *
 * Unified stats return generic development subtrack names such as `Challenge`
 * and `Task`, so anything outside the explicit legacy testing set should stay
 * visible under Development instead of being dropped.
 *
 * @param {MemberStats | undefined} subTrack - The subtrack to inspect.
 * @returns {boolean} Whether the subtrack should render in Testing.
 */
const isTestingSubTrack = (subTrack?: MemberStats): boolean => (
    !!subTrack?.name && testingSubTrackNames.has(subTrack.name)
)

/**
 * Attach parent track metadata to legacy design/develop subtracks and index them by name.
 *
 * @param {string} parentTrack - The top-level track that owns these subtracks.
 * @param {MemberStats[] | undefined} subTracks - The raw subtrack list from member stats.
 * @returns {{[key: string]: MemberStats}} Map of subtracks keyed by subtrack name.
 */
const mapSubTracksByName = (
    parentTrack: 'DESIGN' | 'DEVELOP',
    subTracks?: MemberStats[],
): {[key: string]: MemberStats} => (
    subTracks?.reduce((all, subTrack) => {
        all[subTrack.name] = {
            ...subTrack,
            parentTrack,
            path: `${parentTrack}.subTracks`,
        }

        return all
    }, {} as {[key: string]: MemberStats}) ?? {}
)

/**
 * Helper function to build aggregated data for a track.
 *
 * @param {string} trackName - The name of the track.
 * @param {MemberStats[]} subTracks - List of subtracks within the main track.
 * @returns {MemberStatsTrack} - Aggregated data for the track.
 */
const buildTrackData = (trackName: string, allSubTracks: MemberStats[]): MemberStatsTrack => {
    const subTracks = allSubTracks.filter(isActiveSubTrack)
    // Calculate total wins, challenges, and submissions for the track
    const totalWins = subTracks.reduce((sum, subTrack) => (sum + (subTrack?.wins || 0)), 0)
    const challengesCount = subTracks.reduce((sum, subTrack) => (sum + (subTrack?.challenges || 0)), 0)
    const submissionsCount = subTracks.reduce((sum, subTrack) => (
        sum + (getSubTrackSubmissionCount(subTrack) ?? 0)
    ), 0)
    const hasSubmissionCounts = subTracks.some(subTrack => getSubTrackSubmissionCount(subTrack) !== undefined)

    // Return aggregated track data
    return {
        challenges: challengesCount,
        isActive: subTracks.length > 0,
        name: trackName,
        order: 1,
        submissions: hasSubmissionCounts ? submissionsCount : undefined,
        subTracks,
        wins: totalWins,
    }
}

const enhanceDesignTrackData = (trackData: MemberStatsTrack): MemberStatsTrack => {
    const { subTracks, submissions = 0, challenges = 0 }: MemberStatsTrack = trackData

    const submissionRate = calcProportionalAverage(
        subTracks,
        ['challenges'],
        ['submissions.submissionRate', 'submissionRate'],
        challenges,
    )

    const screeningSuccessRate = calcProportionalAverage(
        subTracks,
        ['submissions.submissions', 'submissions'],
        ['submissions.screeningSuccessRate', 'screeningSuccessRate'],
        submissions,
    )

    return {
        ...trackData,
        screeningSuccessRate,
        submissionRate,
    }
}

/**
 * Custom hook to fetch active tracks for a user, sorted by wins & submissions.
 *
 * @param {UserStats | undefined} memberStats - The raw stats payload for the user.
 * @returns {MemberStatsTrack[]} - List of active tracks for the user.
 */
export const getActiveTracks = (memberStats?: UserStats): MemberStatsTrack[] => {
    // Create mappings for data science subtracks
    const dataScienceSubTracks: {[key: string]: MemberStats | SRMStats} = {
        // Map MARATHON_MATCH subtrack
        MARATHON_MATCH: (memberStats?.DATA_SCIENCE?.MARATHON_MATCH && ({
            ...memberStats.DATA_SCIENCE.MARATHON_MATCH,
            name: 'MARATHON_MATCH',
            parentTrack: 'DATA_SCIENCE',
            path: 'DATA_SCIENCE',

        })) as MemberStats,
        // Map SRM subtrack
        SRM: (memberStats?.DATA_SCIENCE?.SRM && ({
            ...memberStats.DATA_SCIENCE.SRM,
            name: 'SRM',
            parentTrack: 'DATA_SCIENCE',
            path: 'DATA_SCIENCE',
        })) as SRMStats & {name: string},
    }

    // Create mappings for design subtracks
    const designSubTracks: {[key: string]: MemberStats} = mapSubTracksByName(
        'DESIGN',
        memberStats?.DESIGN?.subTracks,
    )

    // Create mappings for develop subtracks
    const developSubTracks: {[key: string]: MemberStats} = mapSubTracksByName(
        'DEVELOP',
        memberStats?.DEVELOP?.subTracks,
    )

    // Build aggregated stats for Design, Development, Testing, and Competitive Programming tracks
    // Design
    const designTrackStats: MemberStatsTrack = (
        enhanceDesignTrackData(
            buildTrackData('Design', Object.values(designSubTracks)),
        )
    )

    // Development
    const developTrackStats: MemberStatsTrack = (
        buildTrackData(
            'Development',
            Object.values(developSubTracks)
                .filter(subTrack => !isTestingSubTrack(subTrack)),
        )
    )

    // Testing
    const testingTrackStats: MemberStatsTrack = (
        buildTrackData(
            'Testing',
            Object.values(developSubTracks)
                .filter(isTestingSubTrack),
        )
    )

    // Data science
    const dsSubTracks: MemberStats[] = [
        dataScienceSubTracks.MARATHON_MATCH,
    ].filter(d => d?.challenges > 0) as MemberStats[]

    const dsTrackStats: MemberStatsTrack = {
        challenges: dataScienceSubTracks.MARATHON_MATCH?.challenges ?? 0,
        isActive: (dataScienceSubTracks.MARATHON_MATCH?.challenges ?? 0) > 0,
        isDSTrack: true,
        name: 'Data Science',
        order: -1,
        percentile: dataScienceSubTracks.MARATHON_MATCH?.rank?.percentile ?? 0,
        rating: dataScienceSubTracks.MARATHON_MATCH?.rank?.rating ?? 0,
        subTracks: dsSubTracks,
        wins: dataScienceSubTracks.MARATHON_MATCH?.wins ?? 0,
    }

    // Competitive Programming
    const cpSubTracks: MemberStats[] = [
        dataScienceSubTracks.SRM,
    ].filter(d => d?.challenges > 0) as MemberStats[]

    const cpTrackStats: MemberStatsTrack = {
        challenges: dataScienceSubTracks.SRM?.challenges ?? 0,
        isActive: (dataScienceSubTracks.SRM?.challenges ?? 0) > 0,
        isCPTrack: true,
        isDSTrack: true,
        name: 'Competitive Programming',
        order: -2,
        percentile: dataScienceSubTracks.SRM?.rank?.percentile ?? 0,
        rating: dataScienceSubTracks.SRM?.rank?.rating ?? 0,
        subTracks: cpSubTracks,
        wins: dataScienceSubTracks.SRM?.wins ?? 0,
    }

    // Order and filter active tracks based on wins and submissions
    return orderBy(filter([
        dsTrackStats,
        cpTrackStats,
        designTrackStats,
        developTrackStats,
        testingTrackStats,
    ], { isActive: true }), ['order', 'wins', 'submissions'], ['desc', 'desc', 'desc'])
}

/**
 * Custom hook to fetch active tracks for a user, sorted by wins & submissions.
 *
 * @param {string} userHandle - The user's handle.
 * @returns {MemberStatsTrack[]} - List of active tracks for the user.
 */
export const useFetchActiveTracks = (userHandle: string): MemberStatsTrack[] => {
    const memberStats: UserStats | undefined = useMemberStats(userHandle)

    return useMemo(() => getActiveTracks(memberStats), [memberStats])
}

/**
 * Custom hook to fetch data for a specific track.
 *
 * @param {string} userHandle - The user's handle.
 * @param {string | undefined} track - The name of the track to fetch.
 * @returns {MemberStatsTrack | undefined} - Data for the specified track or undefined if not found.
 */
export const useFetchTrackData = (userHandle: string, track: string | undefined): MemberStatsTrack | undefined => {
    const activeTracks = useFetchActiveTracks(userHandle)
    // Find and return the specified track from the active tracks
    return find(activeTracks, { name: track })
}

/**
 * Interface defining the shape of subtrack data.
 */
interface SubTrackData extends Partial<MemberStats> {
    trackData: MemberStatsTrack,
}

/**
 * Custom hook to fetch data for a specific subtrack within a track.
 *
 * @param {string} userHandle - The user's handle.
 * @param {string | undefined} track - The name of the track containing the subtrack.
 * @param {string | undefined} subTrack - The name of the subtrack to fetch.
 * @returns {SubTrackData | undefined} - Data for the specified subtrack or undefined if not found.
 */
export const useFetchSubTrackData = (
    userHandle: string,
    track: string | undefined,
    subTrack: string | undefined,
): SubTrackData | undefined => {
    const activeTracks = useFetchActiveTracks(userHandle)
    const trackData = find(activeTracks, { name: track })

    if (!trackData) {
        return undefined
    }

    const subTrackData = find(get(trackData, 'subTracks'), { name: subTrack })

    return {
        ...subTrackData, trackData,
    }
}
