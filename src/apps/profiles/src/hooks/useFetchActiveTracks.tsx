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
    'Challenge',
    'MARATHON_MATCH',
    'SRM',
    'challenges',
    'mostRecentEventDate',
    'mostRecentEventName',
    'mostRecentSubmission',
    'wins',
])

const AI_ENGINEERING_DISPLAY_NAME = 'AI Engineering'

const aiEngineeringRatingPathNames = new Set([
    'AI',
    'AI_ENGINEER',
    'AI_ENGINEERING',
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
 * Return the submission count to display in the profile stats UI.
 *
 * Unified Data Science and configured rating-path rows can omit explicit
 * submission counters even though their challenge count is sourced from valid
 * submissions. In that case, use challenge participation count so the profile
 * does not display impossible zero-submission wins.
 *
 * @param {MemberStats | undefined} subTrack - The subtrack to inspect.
 * @returns {number | undefined} Explicit submissions, or challenge count as a fallback.
 */
export const getSubTrackDisplaySubmissionCount = (subTrack?: MemberStats): number | undefined => {
    const submissionCount = getSubTrackSubmissionCount(subTrack)

    if (submissionCount !== undefined) {
        return submissionCount
    }

    return typeof subTrack?.challenges === 'number' && subTrack.challenges > 0
        ? subTrack.challenges
        : undefined
}

/**
 * Determine whether the subtrack should be considered active.
 *
 * Some rated rows can have zero submissions while still having challenge
 * history, so challenge count also keeps the subtrack visible.
 *
 * @param {MemberStats | undefined} subTrack - The subtrack to inspect.
 * @returns {boolean} Whether the subtrack has activity worth rendering.
 */
const isActiveSubTrack = (subTrack?: MemberStats): boolean => {
    const submissionCount = getSubTrackDisplaySubmissionCount(subTrack)

    return (submissionCount ?? 0) > 0 || (subTrack?.challenges ?? 0) > 0
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
 * Pick the Data Science subtrack rating used by the summary card.
 *
 * Data Science can include Marathon Match and Challenge ratings. The summary
 * should show the strongest visible rating instead of always using Marathon
 * Match, otherwise Data Science Challenge ratings are hidden from the profile.
 *
 * @param {MemberStats[]} subTracks - Active Data Science subtracks.
 * @returns {MemberStats | undefined} The subtrack with the highest rating.
 */
const getDataScienceSummarySubTrack = (subTracks: MemberStats[]): MemberStats | undefined => orderBy(
    subTracks,
    [
        subTrack => subTrack.rank?.rating ?? 0,
        subTrack => subTrack.rank?.percentile ?? 0,
        subTrack => subTrack.challenges ?? 0,
    ],
    ['desc', 'desc', 'desc'],
)[0]

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
 * Checks whether a configured rating path is one of the AI Engineering aliases.
 *
 * @param {string | undefined} ratingPathName - DATA_SCIENCE rating path key.
 * @returns {boolean} Whether the path should render as Development > AI Engineering.
 */
const isAIEngineeringRatingPathName = (ratingPathName?: string): boolean => (
    aiEngineeringRatingPathNames.has(normalizeTrackToken(ratingPathName))
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
        sum + (getSubTrackDisplaySubmissionCount(subTrack) ?? 0)
    ), 0)
    const hasSubmissionCounts = subTracks.some(subTrack => getSubTrackDisplaySubmissionCount(subTrack) !== undefined)

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
 * Converts a top-level AI payload into source subtracks for aggregation.
 *
 * @param {MemberStatsGroup | undefined} aiStats - Raw top-level AI stats payload.
 * @returns {MemberStats[]} Source subtracks used to aggregate an AI Engineering row.
 */
const getTopLevelAIEngineeringSourceSubTracks = (aiStats?: MemberStatsGroup): MemberStats[] => {
    if (!aiStats) {
        return []
    }

    if (aiStats.subTracks?.length) {
        return Object.values(mapSubTracksByName('AI_ENGINEERING', aiStats.subTracks))
    }

    return [{
        ...(aiStats as MemberStats),
        name: AI_ENGINEERING_DISPLAY_NAME,
        parentTrack: 'AI_ENGINEERING',
        path: 'AI_ENGINEERING',
    }]
}

/**
 * Checks whether a top-level AI payload has visible profile activity.
 *
 * @param {MemberStatsTrack} trackData - Aggregated AI source subtrack data.
 * @param {number | undefined} rating - Current AI Engineering rating.
 * @param {number | undefined} challenges - Current AI Engineering challenge count.
 * @param {number | undefined} submissions - Current AI Engineering submission count.
 * @param {number | undefined} wins - Current AI Engineering win count.
 * @returns {boolean} Whether the payload should create a Development subtrack.
 */
const hasTopLevelAIEngineeringActivity = (
    trackData: MemberStatsTrack,
    rating?: number,
    challenges?: number,
    submissions?: number,
    wins?: number,
): boolean => (
    trackData.isActive
    || !!rating
    || !!challenges
    || !!submissions
    || !!wins
)

/**
 * Builds the rank object for a Development AI Engineering subtrack.
 *
 * @param {MemberStatsGroup} aiStats - Raw top-level AI stats payload.
 * @param {number | undefined} rating - Current AI Engineering rating.
 * @param {number | undefined} percentile - Current AI Engineering percentile.
 * @returns {MemberStats['rank']} Rank fields for the display subtrack.
 */
const buildAIEngineeringRank = (
    aiStats: MemberStatsGroup,
    rating?: number,
    percentile?: number,
): MemberStats['rank'] => ({
    ...((aiStats as MemberStats).rank ?? {}),
    ...(rating === undefined ? {} : { rating }),
    ...(percentile === undefined ? {} : { overallPercentile: percentile }),
})

/**
 * Builds the submissions field for a Development AI Engineering subtrack.
 *
 * @param {MemberStatsGroup} aiStats - Raw top-level AI stats payload.
 * @param {number | undefined} submissions - Aggregated submission count.
 * @returns {MemberStats['submissions']} Submission stats for the display subtrack.
 */
const buildAIEngineeringSubmissions = (
    aiStats: MemberStatsGroup,
    submissions?: number,
): MemberStats['submissions'] => (
    submissions === undefined
        ? (aiStats as MemberStats).submissions
        : { submissions }
)

/**
 * Builds a Development subtrack from a top-level AI Engineering API payload.
 *
 * @param {UserStats | undefined} memberStats - The raw stats payload for the user.
 * @returns {MemberStats | undefined} AI Engineering subtrack data when active stats exist.
 */
const buildTopLevelAIEngineeringSubTrack = (memberStats?: UserStats): MemberStats | undefined => {
    const aiStats = getAIEngineeringStats(memberStats)

    if (!aiStats) {
        return undefined
    }

    const subTracks = getTopLevelAIEngineeringSourceSubTracks(aiStats)
    const trackData = buildTrackData(AI_ENGINEERING_DISPLAY_NAME, subTracks)
    const submissions = getSubTrackSubmissionCount(aiStats as MemberStats | undefined) ?? trackData.submissions
    const challenges = getFiniteNumber(aiStats?.challenges) ?? trackData.challenges ?? 0
    const rating = getFiniteNumber(aiStats?.rank?.rating)
    const wins = getFiniteNumber(aiStats?.wins) ?? trackData.wins
    const percentile = getFiniteNumber(aiStats?.rank?.overallPercentile)
        ?? getFiniteNumber(aiStats?.rank?.percentile)

    if (!hasTopLevelAIEngineeringActivity(trackData, rating, challenges, submissions, wins)) {
        return undefined
    }

    return {
        ...(aiStats as MemberStats),
        challenges,
        name: AI_ENGINEERING_DISPLAY_NAME,
        parentTrack: 'AI_ENGINEERING',
        path: 'AI_ENGINEERING',
        rank: buildAIEngineeringRank(aiStats, rating, percentile),
        submissions: buildAIEngineeringSubmissions(aiStats, submissions),
        wins,
    }
}

/**
 * Builds a Development subtrack from a DATA_SCIENCE AI Engineering rating path.
 *
 * The API can return configured AI Engineering rows under DATA_SCIENCE while
 * the profile hierarchy displays that rating path under Development. The
 * returned subtrack keeps DATA_SCIENCE metadata so history and distribution
 * calls still use the stored API dimension.
 *
 * @param {UserStats | undefined} memberStats - The raw stats payload for the user.
 * @returns {MemberStats | undefined} AI Engineering subtrack data when the path is rated.
 */
const buildDataScienceAIEngineeringSubTrack = (memberStats?: UserStats): MemberStats | undefined => {
    const dataScienceStats = memberStats?.DATA_SCIENCE

    if (!dataScienceStats) {
        return undefined
    }

    const candidates = Object.entries(dataScienceStats)
        .reduce((subTracks: MemberStats[], [ratingPathName, ratingPathStats]) => {
            if (
                nativeDataScienceStatsKeys.has(ratingPathName)
                || !isAIEngineeringRatingPathName(ratingPathName)
                || !isDataScienceRatingPathStats(ratingPathStats)
            ) {
                return subTracks
            }

            subTracks.push({
                ...(ratingPathStats as MemberStats),
                name: AI_ENGINEERING_DISPLAY_NAME,
                parentTrack: 'DATA_SCIENCE',
                path: 'DATA_SCIENCE',
            })

            return subTracks
        }, [])

    return getDataScienceSummarySubTrack(candidates)
}

/**
 * Returns the AI Engineering subtrack that should be grouped under Development.
 *
 * DATA_SCIENCE rating-path rows are preferred because they retain the native
 * history/distribution path for existing API payloads. Top-level AI payloads
 * are still supported for compatibility.
 *
 * @param {UserStats | undefined} memberStats - The raw stats payload for the user.
 * @returns {MemberStats | undefined} Display-ready Development subtrack.
 */
const getAIEngineeringDevelopmentSubTrack = (memberStats?: UserStats): MemberStats | undefined => (
    buildDataScienceAIEngineeringSubTrack(memberStats)
        ?? buildTopLevelAIEngineeringSubTrack(memberStats)
)

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
        submissions: getSubTrackDisplaySubmissionCount(subTrack),
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
                || isAIEngineeringRatingPathName(ratingPathName)
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
        // Map Challenge subtrack
        Challenge: (memberStats?.DATA_SCIENCE?.Challenge && ({
            ...memberStats.DATA_SCIENCE.Challenge,
            name: 'Challenge',
            parentTrack: 'DATA_SCIENCE',
            path: 'DATA_SCIENCE',
        })) as MemberStats,
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

    const qaSubTracks: {[key: string]: MemberStats} = mapSubTracksByName(
        'QA',
        memberStats?.QA?.subTracks,
    )

    // Build aggregated stats for Design, Development, Testing, and Competitive Programming tracks
    // Design
    const designTrackStats: MemberStatsTrack = (
        enhanceDesignTrackData(
            buildTrackData('Design', Object.values(designSubTracks)),
        )
    )

    // Development
    const aiEngineeringDevelopmentSubTrack = getAIEngineeringDevelopmentSubTrack(memberStats)
    const developSubTrackValues = Object.values(developSubTracks)
    const hasDevelopmentAIEngineeringSubTrack = developSubTrackValues
        .some(subTrack => isAIEngineeringRatingPathName(subTrack.name))
    const developTrackStats: MemberStatsTrack = (
        buildTrackData(
            'Development',
            [
                ...developSubTrackValues,
                ...(hasDevelopmentAIEngineeringSubTrack || !aiEngineeringDevelopmentSubTrack
                    ? []
                    : [aiEngineeringDevelopmentSubTrack]),
            ]
                .filter(subTrack => !isTestingSubTrack(subTrack)),
        )
    )

    // Testing
    const testingTrackStats: MemberStatsTrack = (
        buildTrackData(
            'Testing',
            [
                ...Object.values(developSubTracks)
                    .filter(isTestingSubTrack),
                ...Object.values(qaSubTracks),
            ],
        )
    )

    // Data science
    const dsSubTracks: MemberStats[] = [
        dataScienceSubTracks.Challenge,
        dataScienceSubTracks.MARATHON_MATCH,
    ].filter(d => d?.challenges > 0) as MemberStats[]
    const dsTrackData: MemberStatsTrack = buildTrackData('Data Science', dsSubTracks)
    const dsSummarySubTrack: MemberStats | undefined = getDataScienceSummarySubTrack(dsTrackData.subTracks)
    const dataScienceRatingPathTrackStats: MemberStatsTrack[] = getDataScienceRatingPathTrackData(memberStats)

    const dsTrackStats: MemberStatsTrack = {
        ...dsTrackData,
        isDSTrack: true,
        order: -1,
        percentile: dsSummarySubTrack?.rank?.percentile ?? 0,
        rating: dsSummarySubTrack?.rank?.rating ?? 0,
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
