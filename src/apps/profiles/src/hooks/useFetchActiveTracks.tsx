import { useMemo } from 'react'
import { filter, find, orderBy } from 'lodash'

import { MemberStats, SRMStats, useMemberStats, UserStats } from '~/libs/core'

export interface MemberStatsTrack {
    challenges?: number,
    isActive: boolean,
    name: string,
    submissions?: number,
    subTracks: MemberStats[],
    ranking?: number,
    wins: number,
}

const buildTrackData = (trackName: string, subTracks: MemberStats[]): MemberStatsTrack => {
    const totalWins = subTracks.reduce((sum, subTrack) => (sum + (subTrack?.wins || 0)), 0)
    const challengesCount = subTracks.reduce((sum, subTrack) => (sum + (subTrack?.challenges || 0)), 0)
    const submissionsCount = subTracks.reduce((sum, subTrack) => (
        sum + (subTrack?.submissions?.submissions || 0)
    ), 0)

    return {
        challenges: challengesCount,
        isActive: challengesCount > 0,
        name: trackName,
        submissions: submissionsCount,
        subTracks,
        wins: totalWins,
    }
}

export const useFetchActiveTracks = (userHandle: string): MemberStatsTrack[] => {
    const memberStats: UserStats | undefined = useMemberStats(userHandle)

    const dataScienceSubTracks: {[key: string]: MemberStats | SRMStats} = useMemo(() => ({
        MARATHON_MATCH: (memberStats?.DATA_SCIENCE?.MARATHON_MATCH && ({
            ...memberStats.DATA_SCIENCE.MARATHON_MATCH,
            name: 'MARATHON_MATCH',
        })) as MemberStats,
        SRM: (memberStats?.DATA_SCIENCE?.SRM && ({
            ...memberStats.DATA_SCIENCE.SRM,
            name: 'SRM',
        })) as SRMStats & {name: string},
    }), [memberStats])

    // Create mappings for the subtracks, by the subtrack name, so we can easily access it later on
    const designSubTracks: {[key: string]: MemberStats} = useMemo(() => (
        memberStats?.DESIGN?.subTracks.reduce((all, subTrack) => {
            all[subTrack.name] = subTrack
            return all
        }, {} as {[key: string]: MemberStats}) ?? {}
    ), [memberStats])

    const developSubTracks: {[key: string]: MemberStats} = useMemo(() => (
        memberStats?.DEVELOP?.subTracks.reduce((all, subTrack) => {
            all[subTrack.name] = subTrack
            return all
        }, {} as {[key: string]: MemberStats}) ?? {}
    ), [memberStats])

    // Design
    const designTrackStats: MemberStatsTrack = useMemo(() => (
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
        ].filter(Boolean))
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
        const subTracks = [
            dataScienceSubTracks.MARATHON_MATCH,
            dataScienceSubTracks.SRM,
        ].filter(Boolean) as MemberStats[]

        return {
            challenges: memberStats?.DATA_SCIENCE?.challenges ?? 0,
            isActive: (memberStats?.DATA_SCIENCE?.challenges ?? 0) > 0,
            name: 'Competitive Programming',
            ranking: Math.max(
                dataScienceSubTracks.MARATHON_MATCH?.rank.percentile ?? 0,
                dataScienceSubTracks.SRM?.rank.percentile ?? 0,
            ),
            subTracks,
            wins: memberStats?.DATA_SCIENCE?.wins ?? 0,
        }
    }, [dataScienceSubTracks, memberStats])

    // copilot
    // const copilotTrackStats = useMemo(() => ({
    //     isActive: (memberStats?.DATA_SCIENCE?.challenges ?? 0) > 0,
    //     ranking: Math.max(
    //         memberStats?.DATA_SCIENCE?.MARATHON_MATCH.rank.percentile ?? 0,
    //         memberStats?.DATA_SCIENCE?.SRM.rank.percentile ?? 0,
    //     ),
    //     wins: memberStats?.DATA_SCIENCE?.wins ?? 0,
    // }), [memberStats])

    return orderBy(filter([
        cpTrackStats,
        designTrackStats,
        developTrackStats,
        testingTrackStats,
    ], { isActive: true }), ['wins', 'submissions'], 'desc')
}

export const useFetchTrackData = (userHandle: string, track: string | undefined): any => {
    const activeTracks = useFetchActiveTracks(userHandle)
    return find(activeTracks, { name: track })
}

export const useFetchSubTrackData = (
    userHandle: string,
    track: string | undefined,
    subTrack: string | undefined,
): any => {
    const activeTracks = useFetchActiveTracks(userHandle)
    const trackData = find(activeTracks, { name: track })
    const subTrackData = find(trackData?.subTracks, { name: subTrack })

    return {
        ...subTrackData, trackData,
    }
}
