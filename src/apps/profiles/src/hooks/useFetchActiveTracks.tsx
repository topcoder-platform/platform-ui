import { useMemo } from 'react'
import { filter, find, get, orderBy } from 'lodash'

import {
    DataScienceRatingPathStats,
    MemberStats,
    MemberStatsGroup,
    SRMStats,
    useMemberStats,
    UserStats,
} from '~/libs/core'

import { calcProportionalAverage } from '../lib/math.utils'

const testingSubTrackNames = new Set([
    'BUG_HUNT',
    'TEST_SCENARIOS',
    'TEST_SUITES',
])

const nativeDataScienceStatsKeys = new Set([
    'MARATHON_MATCH',
    'SRM',
    'challenges',
    'mostRecentEventDate',
    'mostRecentEventName',
    'mostRecentSubmission',
    'wins',
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
    challengePoints?: number
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
    parentTrack: string,
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

const getFiniteNumber = (value: unknown): number | undefined => (
    typeof value === 'number' && Number.isFinite(value) ? value : undefined
)

/**
 * Determine whether a DATA_SCIENCE entry is a configured rating path.
 *
 * Native data science fields include counters and known subtracks; configured
 * rating paths are keyed by their path name and should only become profile
 * cells after the member has an actual rating.
 *
 * @param {unknown} statsEntry - A DATA_SCIENCE value from the member stats payload.
 * @returns {boolean} Whether the value is a rated custom path stats object.
 */
const isDataScienceRatingPathStats = (statsEntry: unknown): statsEntry is DataScienceRatingPathStats => (
    typeof statsEntry === 'object'
    && statsEntry !== null
    && !Array.isArray(statsEntry)
    && getFiniteNumber((statsEntry as DataScienceRatingPathStats).rank?.rating) !== undefined
)

/**
 * Returns the AI Engineering stats payload from the known API keys.
 *
 * @param {UserStats | undefined} memberStats - The raw stats payload for the user.
 * @returns {MemberStatsGroup | undefined} AI Engineering stats when the API includes them.
 */
const getAIEngineeringStats = (memberStats?: UserStats): MemberStatsGroup | undefined => (
    memberStats?.AI_ENGINEERING ?? memberStats?.AI ?? memberStats?.AI_ENGINEER
)

/**
 * Returns the member's total challenge points from the known API keys.
 *
 * @param {UserStats | undefined} memberStats - The raw stats payload for the user.
 * @returns {number | undefined} Challenge points when the API includes them.
 */
export const getMemberChallengePoints = (memberStats?: UserStats): number | undefined => {
    const stats = memberStats as (
        UserStats & {
            challengePointsTotal?: number
            points?: number
        }
    )

    return getFiniteNumber(stats?.challengePoints)
        ?? getFiniteNumber(stats?.CHALLENGE_POINTS)
        ?? getFiniteNumber(stats?.challengePointsTotal)
        ?? getFiniteNumber(stats?.points)
        ?? getFiniteNumber(getAIEngineeringStats(memberStats)?.challengePoints)
}

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
 * Builds the AI Engineering aggregate stats row from a top-level API payload.
 *
 * @param {UserStats | undefined} memberStats - The raw stats payload for the user.
 * @returns {MemberStatsTrack} Aggregated AI Engineering stats for the member stats UI.
 */
const buildAIEngineeringTrackData = (memberStats?: UserStats): MemberStatsTrack => {
    const aiStats = getAIEngineeringStats(memberStats)
    const subTracks: MemberStats[] = aiStats?.subTracks?.length ? (
        Object.values(mapSubTracksByName('AI_ENGINEERING', aiStats.subTracks))
    ) : (aiStats ? [{
        ...(aiStats as MemberStats),
        name: aiStats.name ?? 'AI_ENGINEERING',
        parentTrack: 'AI_ENGINEERING',
        path: 'AI_ENGINEERING',
    }] : [])

    const trackData = buildTrackData('AI Engineering', subTracks)
    const submissions = getSubTrackSubmissionCount(aiStats as MemberStats | undefined) ?? trackData.submissions
    const challenges = getFiniteNumber(aiStats?.challenges) ?? trackData.challenges
    const rating = getFiniteNumber(aiStats?.rank?.rating)
    const wins = getFiniteNumber(aiStats?.wins) ?? trackData.wins

    return {
        ...trackData,
        challengePoints: getFiniteNumber(aiStats?.challengePoints),
        challenges,
        isActive: trackData.isActive
            || !!rating
            || !!challenges
            || !!submissions
            || !!wins,
        name: 'AI Engineering',
        order: 2,
        percentile: getFiniteNumber(aiStats?.rank?.overallPercentile) ?? getFiniteNumber(aiStats?.rank?.percentile),
        rating,
        submissions,
        subTracks,
        wins,
    }
}

/**
 * Builds an active track from a configured DATA_SCIENCE rating path.
 *
 * The member API stores configured rating paths under `DATA_SCIENCE.<pathName>`,
 * so each path is represented as its own single-subtrack cell while retaining
 * `DATA_SCIENCE` as the API track for history and distribution calls.
 *
 * @param {string} ratingPathName - The configured rating path name, for example `AI`.
 * @param {DataScienceRatingPathStats} ratingPathStats - Stats returned for the configured rating path.
 * @returns {MemberStatsTrack} Display data for the configured rating path.
 */
const buildDataScienceRatingPathTrackData = (
    ratingPathName: string,
    ratingPathStats: DataScienceRatingPathStats,
): MemberStatsTrack => {
    const subTrack: MemberStats = {
        ...(ratingPathStats as MemberStats),
        name: ratingPathName,
        parentTrack: 'DATA_SCIENCE',
        path: 'DATA_SCIENCE',
    }

    return {
        challenges: getFiniteNumber(ratingPathStats.challenges) ?? 0,
        isActive: true,
        isDSTrack: true,
        name: ratingPathName,
        order: -1,
        percentile: getFiniteNumber(ratingPathStats.rank?.overallPercentile)
            ?? getFiniteNumber(ratingPathStats.rank?.percentile),
        rating: getFiniteNumber(ratingPathStats.rank?.rating),
        subTracks: [subTrack],
        wins: getFiniteNumber(ratingPathStats.wins) ?? 0,
    }
}

/**
 * Builds active tracks for custom DATA_SCIENCE rating paths returned by the member API.
 *
 * @param {UserStats | undefined} memberStats - The raw stats payload for the user.
 * @returns {MemberStatsTrack[]} Rated custom data science paths to display in Member Stats.
 */
const getDataScienceRatingPathTrackData = (memberStats?: UserStats): MemberStatsTrack[] => {
    const dataScienceStats = memberStats?.DATA_SCIENCE

    if (!dataScienceStats) {
        return []
    }

    return Object.entries(dataScienceStats)
        .reduce((ratingPathTracks: MemberStatsTrack[], [ratingPathName, ratingPathStats]) => {
            if (
                nativeDataScienceStatsKeys.has(ratingPathName)
                || !isDataScienceRatingPathStats(ratingPathStats)
            ) {
                return ratingPathTracks
            }

            ratingPathTracks.push(buildDataScienceRatingPathTrackData(ratingPathName, ratingPathStats))

            return ratingPathTracks
        }, [])
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
    // AI Engineering
    const aiEngineeringTrackStats: MemberStatsTrack = buildAIEngineeringTrackData(memberStats)

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
    const dataScienceRatingPathTrackStats: MemberStatsTrack[] = getDataScienceRatingPathTrackData(memberStats)

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
        aiEngineeringTrackStats,
        dsTrackStats,
        cpTrackStats,
        designTrackStats,
        developTrackStats,
        testingTrackStats,
        ...dataScienceRatingPathTrackStats,
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
