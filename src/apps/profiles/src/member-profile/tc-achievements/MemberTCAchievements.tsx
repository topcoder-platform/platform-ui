import { FC, useCallback, useMemo } from 'react'
import { Outlet, Route, Routes } from 'react-router-dom'

import {
    useMemberBadges,
    useMemberStats,
    UserBadge,
    UserBadgesResponse,
    UserProfile,
    UserStats,
} from '~/libs/core'

import { DefaultAchievementsView } from './default-achievements-view'
import { TrackView } from './track-view'
import { SubTrackView } from './sub-track-view'
import styles from './MemberTCAchievements.module.scss'

interface MemberTCAchievementsProps {
    profile: UserProfile
}

const MemberTCAchievements: FC<MemberTCAchievementsProps> = (props: MemberTCAchievementsProps) => {
    const memberStats: UserStats | undefined = useMemberStats(props.profile?.handle)

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

    const renderDefaultRoute = useCallback(() => (
        <DefaultAchievementsView
            profile={props.profile}
            tcoWins={tcoWins}
            tcoQualifications={tcoQualifications}
            tcoTrips={tcoTrips}
            memberStats={memberStats}
        />
    ), [memberStats, props.profile, tcoQualifications, tcoTrips, tcoWins])

    if (!memberStats?.challenges && !tcoWins && !tcoQualifications) {
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
