import { FC, useCallback, useMemo } from 'react'
import { Location, Outlet, Route, Routes, useLocation } from 'react-router-dom'

import {
    MemberRoleStats,
    useMemberBadges,
    useMemberRoleStats,
    useMemberStats,
    UserBadge,
    UserBadgesResponse,
    UserProfile,
    UserStats,
} from '~/libs/core'

import { DefaultAchievementsView } from './default-achievements-view'
import { MemberRoleDetailsView } from './member-role-details-view'
import { SubTrackView } from './sub-track-view'
import { TrackView } from './track-view'
import styles from './MemberTCAchievements.module.scss'

interface MemberTCAchievementsProps {
    profile: UserProfile
}

const MemberTCAchievements: FC<MemberTCAchievementsProps> = (props: MemberTCAchievementsProps) => {
    const location: Location = useLocation()
    const memberStats: UserStats | undefined = useMemberStats(props.profile?.handle)
    const { data: roleStats }: { data?: MemberRoleStats } = useMemberRoleStats(props.profile?.handle)

    const memberBadges: UserBadgesResponse | undefined
        = useMemberBadges(props.profile?.userId as number, { limit: 500 })

    const tcoWins: number = useMemo(() => memberBadges?.rows.filter(
        (badge: UserBadge) => /TCO.*Champion/.test(badge.org_badge.badge_name),
    ).length || 0, [memberBadges])

    const tcoQualifications: number = useMemo(() => memberBadges?.rows.filter(
        (badge: UserBadge) => /TCO.*Finalist/.test(badge.org_badge.badge_name),
    ).length || 0, [memberBadges])

    const tcoTrips: number = useMemo(() => memberBadges?.rows.filter(
        (badge: UserBadge) => /TCO.*Trip Winner/.test(badge.org_badge.badge_name),
    ).length || 0, [memberBadges])
    const hasChallengePoints: boolean = (props.profile.challengePoints?.total ?? 0) > 0

    const renderDefaultRoute = useCallback(() => (
        <DefaultAchievementsView
            profile={props.profile}
            tcoWins={tcoWins}
            tcoQualifications={tcoQualifications}
            tcoTrips={tcoTrips}
            memberStats={memberStats}
            roleStats={roleStats}
        />
    ), [memberStats, props.profile, roleStats, tcoQualifications, tcoTrips, tcoWins])

    const hasSpecialRole = !!roleStats?.copilot?.challengeCount || !!roleStats?.reviewer?.challengeCount
    const isRoleDetailsRoute = /\/stats\/roles\/[^/]+\/?$/i.test(location.pathname)

    if (
        !memberStats?.challenges
        && !hasChallengePoints
        && !tcoWins
        && !tcoQualifications
        && !tcoTrips
        && !hasSpecialRole
        && !isRoleDetailsRoute
    ) {
        return <></>
    }

    return (
        <div className={styles.container}>
            <Outlet />
            <Routes>
                <Route
                    path=''
                    element={renderDefaultRoute()}
                />
                <Route
                    path='roles/:roleType'
                    element={<MemberRoleDetailsView profile={props.profile} />}
                />
                <Route
                    path=':trackType'
                    element={(
                        <TrackView profile={props.profile} renderDefault={renderDefaultRoute} />
                    )}
                />
                <Route
                    path=':trackType/:subTrack'
                    element={(
                        <SubTrackView profile={props.profile} renderDefault={renderDefaultRoute} />
                    )}
                />
            </Routes>
        </div>
    )
}

export default MemberTCAchievements
