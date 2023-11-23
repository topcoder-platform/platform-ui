import { useMemo } from 'react'
import { filter, find, get, orderBy } from 'lodash'

import { MemberStats, SRMStats, useMemberStats, UserStats } from '~/libs/core'

import { calcProportionalAverage } from '../lib/math.utils'

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
    ranking?: number,
    submissionRate?: number
    screeningSuccessRate?: number
    wins: number,
    order?: number
}

/**
 * Helper function to build aggregated data for a track.
 *
 * @param {string} trackName - The name of the track.
 * @param {MemberStats[]} subTracks - List of subtracks within the main track.
 * @returns {MemberStatsTrack} - Aggregated data for the track.
 */
const buildTrackData = (trackName: string, subTracks: MemberStats[]): MemberStatsTrack => {
    // Calculate total wins, challenges, and submissions for the track
    const totalWins = subTracks.reduce((sum, subTrack) => (sum + (subTrack?.wins || 0)), 0)
    const challengesCount = subTracks.reduce((sum, subTrack) => (sum + (subTrack?.challenges || 0)), 0)
    const submissionsCount = subTracks.reduce((sum, subTrack) => (
        sum + (subTrack?.submissions?.submissions ?? subTrack?.submissions ?? 0)
    ), 0)

    // Return aggregated track data
    return {
        challenges: challengesCount,
        isActive: challengesCount > 0,
        name: trackName,
        order: 1,
        submissions: submissionsCount,
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
 * @param {string} userHandle - The user's handle.
 * @returns {MemberStatsTrack[]} - List of active tracks for the user.
 */
export const useFetchActiveTracks = (userHandle: string): MemberStatsTrack[] => {
    const memberStats: UserStats | undefined = useMemberStats(userHandle)

    // Create mappings for data science subtracks
    const dataScienceSubTracks: {[key: string]: MemberStats | SRMStats} = useMemo(() => ({
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
    }), [memberStats])

    // Create mappings for design subtracks
    const designSubTracks: {[key: string]: MemberStats} = useMemo(() => (
        memberStats?.DESIGN?.subTracks.reduce((all, subTrack) => {
            all[subTrack.name] = {
                ...subTrack,
                parentTrack: 'DESIGN',
                path: 'DESIGN.subTracks',
            }
            return all
        }, {} as {[key: string]: MemberStats}) ?? {}
    ), [memberStats])

    // Create mappings for develop subtracks
    const developSubTracks: {[key: string]: MemberStats} = useMemo(() => (
        memberStats?.DEVELOP?.subTracks.reduce((all, subTrack) => {
            all[subTrack.name] = {
                ...subTrack,
                parentTrack: 'DEVELOP',
                path: 'DEVELOP.subTracks',
            }
            return all
        }, {} as {[key: string]: MemberStats}) ?? {}
    ), [memberStats])

    // Build aggregated stats for Design, Development, Testing, and Competitive Programming tracks
    // Each track is constructed using the buildTrackData helper function
    // The useMemo hook is used to memoize the results for performance optimization

    // Design
    const designTrackStats: MemberStatsTrack = useMemo(() => (
        enhanceDesignTrackData(
            buildTrackData('Design', [
                developSubTracks.DESIGN,
                designSubTracks.DESIGN_FIRST_2_FINISH,
                designSubTracks.WEB_DESIGNS,
                designSubTracks.LOGO_DESIGN,
                designSubTracks.WIREFRAMES,
                designSubTracks.FRONT_END_FLASH,
                designSubTracks.PRINT_OR_PRESENTATION,
                designSubTracks.STUDIO_OTHER,
                designSubTracks.APPLICATION_FRONT_END_DESIGN,
                designSubTracks.BANNERS_OR_ICONS,
                designSubTracks.WIDGET_OR_MOBILE_SCREEN_DESIGN,
            ].filter(Boolean)),
        )
    ), [developSubTracks, designSubTracks])

    // Development
    const developTrackStats: MemberStatsTrack = useMemo(() => (
        buildTrackData('Development', [
            developSubTracks.DEVELOPMENT,
            developSubTracks.ARCHITECTURE,
            developSubTracks.FIRST_2_FINISH,
            developSubTracks.CODE,
            developSubTracks.ASSEMBLY_COMPETITION,
            developSubTracks.UI_PROTOTYPE_COMPETITION,
            developSubTracks.SPECIFICATION,
            developSubTracks.CONCEPTUALIZATION,
        ].filter(Boolean))
    ), [developSubTracks])

    // Testing
    const testingTrackStats: MemberStatsTrack = useMemo(() => (
        buildTrackData('Testing', [
            developSubTracks.BUG_HUNT,
            developSubTracks.TEST_SCENARIOS,
            developSubTracks.TEST_SUITES,
        ].filter(Boolean))
    ), [developSubTracks])

    // Competitive Programming
    const cpTrackStats: MemberStatsTrack = useMemo(() => {
        // Aggregate stats for Competitive Programming track
        const subTracks = [
            dataScienceSubTracks.MARATHON_MATCH,
            dataScienceSubTracks.SRM,
        ].filter(d => d?.challenges > 0) as MemberStats[]

        return {
            challenges: memberStats?.DATA_SCIENCE?.challenges ?? 0,
            isActive: (memberStats?.DATA_SCIENCE?.challenges ?? 0) > 0,
            name: 'Competitive Programming',
            order: -1,
            ranking: Math.max(
                dataScienceSubTracks.MARATHON_MATCH?.rank?.percentile ?? 0,
                dataScienceSubTracks.SRM?.rank?.percentile ?? 0,
            ),
            rating: Math.max(
                dataScienceSubTracks.MARATHON_MATCH?.rank?.rating ?? 0,
                dataScienceSubTracks.SRM?.rank?.rating ?? 0,
            ),
            subTracks,
            wins: memberStats?.DATA_SCIENCE?.wins ?? 0,
        }
    }, [dataScienceSubTracks, memberStats])

    // Order and filter active tracks based on wins and submissions
    return orderBy(filter([
        cpTrackStats,
        designTrackStats,
        developTrackStats,
        testingTrackStats,
    ], { isActive: true }), ['order', 'wins', 'submissions'], ['desc', 'desc', 'desc'])
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
