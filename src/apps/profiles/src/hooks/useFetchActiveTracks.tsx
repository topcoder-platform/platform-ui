import { filter, orderBy } from 'lodash'
import { useMemo } from 'react'

import { MemberStats, useMemberStats, UserStats } from '~/libs/core'

export const useFetchActiveTracks = (userHandle: string): any => {
    const memberStats: UserStats | undefined = useMemberStats(userHandle)

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
    const designTrackStats = useMemo(() => {
        const designStats = developSubTracks.DESIGN
        const designF2FStats = designSubTracks.DESIGN_FIRST_2_FINISH
        const webDesignStats = designSubTracks.WEB_DESIGNS
        const logoDesignStats = designSubTracks.LOGO_DESIGN
        const wireframesStats = designSubTracks.WIREFRAMES
        const frontEndFlashStats = designSubTracks.FRONT_END_FLASH
        const printPresentationStats = designSubTracks.PRINT_OR_PRESENTATION
        const studioOtherStats = designSubTracks.STUDIO_OTHER
        const feDesignStats = designSubTracks.APPLICATION_FRONT_END_DESIGN
        const bannersIconsStats = designSubTracks.BANNERS_OR_ICONS
        const widgetMobileStats = designSubTracks.WIDGET_OR_MOBILE_SCREEN_DESIGN

        const subTracks = [
            designStats,
            designF2FStats,
            webDesignStats,
            logoDesignStats,
            wireframesStats,
            frontEndFlashStats,
            printPresentationStats,
            studioOtherStats,
            feDesignStats,
            bannersIconsStats,
            widgetMobileStats,
        ]

        const totalWins = subTracks.reduce((sum, subTrack) => (sum + (subTrack?.wins || 0)), 0)
        const challengesCount = subTracks.reduce((sum, subTrack) => (sum + (subTrack?.challenges || 0)), 0)
        const submissionsCount = subTracks.reduce((sum, subTrack) => (
            sum + (subTrack?.submissions?.submissions || 0)
        ), 0)

        return {
            isActive: challengesCount > 0,
            name: 'Design',
            submissions: submissionsCount,
            wins: totalWins,
        }
    }, [developSubTracks, designSubTracks])

    // Development
    const developTrackStats = useMemo(() => {
        const developmentStats = developSubTracks.DEVELOPMENT
        const architectureStats = developSubTracks.ARCHITECTURE
        const f2fStats = developSubTracks.FIRST_2_FINISH
        const codeStats = developSubTracks.CODE
        const assemblyStats = developSubTracks.ASSEMBLY_COMPETITION
        const uiPrototypeStats = developSubTracks.UI_PROTOTYPE_COMPETITION

        const subTracks = [
            developmentStats,
            architectureStats,
            f2fStats,
            codeStats,
            assemblyStats,
            uiPrototypeStats,
        ]

        const totalWins = subTracks.reduce((sum, subTrack) => (sum + (subTrack?.wins || 0)), 0)
        const challengesCount = subTracks.reduce((sum, subTrack) => (sum + (subTrack?.challenges || 0)), 0)
        const submissionsCount = subTracks.reduce((sum, subTrack) => (
            sum + (subTrack?.submissions?.submissions || 0)
        ), 0)

        return {
            isActive: challengesCount > 0,
            name: 'Development',
            submissions: submissionsCount,
            wins: totalWins,
        }
    }, [developSubTracks])

    // Testing
    const testingTrackStats = useMemo(() => {
        const bugHuntStats = developSubTracks.BUG_HUNT
        const testScenStats = developSubTracks.TEST_SCENARIOS
        const testSuitesStats = developSubTracks.TEST_SUITES

        const subTracks = [
            bugHuntStats,
            testScenStats,
            testSuitesStats,
        ]

        const totalWins = subTracks.reduce((sum, subTrack) => (sum + (subTrack?.wins || 0)), 0)
        const challengesCount = subTracks.reduce((sum, subTrack) => (sum + (subTrack?.challenges || 0)), 0)
        const submissionsCount = subTracks.reduce((sum, subTrack) => (
            sum + (subTrack?.submissions?.submissions || 0)
        ), 0)

        return {
            isActive: challengesCount > 0,
            name: 'Testing',
            submissions: submissionsCount,
            wins: totalWins,
        }
    }, [developSubTracks])

    // Competitive Programming
    const cpTrackStats = useMemo(() => ({
        isActive: (memberStats?.DATA_SCIENCE?.challenges ?? 0) > 0,
        name: 'Competitive Programming',
        ranking: Math.max(
            memberStats?.DATA_SCIENCE?.MARATHON_MATCH.rank.percentile ?? 0,
            memberStats?.DATA_SCIENCE?.SRM.rank.percentile ?? 0,
        ),
        wins: memberStats?.DATA_SCIENCE?.wins ?? 0,
    }), [memberStats])

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
