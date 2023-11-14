import { FC, useMemo } from 'react'

import {
    useMemberBadges,
    useMemberStats,
    UserBadge,
    UserBadgesResponse,
    UserProfile,
    UserStats,
} from '~/libs/core'

import { CommunityAwards } from '../community-awards'

import { TCOWinsBanner } from './TCOWinsBanner'
import { TcSpecialRolesBanner } from './TcSpecialRolesBanner'
import { MemberStats } from './MemberStats'
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

    return memberStats?.wins || tcoWins || tcoQualifications ? (
        <div className={styles.container}>
            <p className='body-large-medium'>Achievements @ Topcoder</p>

            <div className={styles.achievementsWrap}>
                {
                    (tcoWins > 0 || tcoQualifications > 0 || tcoTrips > 0) && (
                        <TCOWinsBanner tcoWins={tcoWins} tcoQualifications={tcoQualifications} tcoTrips={tcoTrips} />
                    )
                }
                <MemberStats profile={props.profile} />
            </div>

            <TcSpecialRolesBanner memberStats={memberStats} />

            <CommunityAwards profile={props.profile} />
        </div>
    ) : <></>
}

export default MemberTCAchievements
