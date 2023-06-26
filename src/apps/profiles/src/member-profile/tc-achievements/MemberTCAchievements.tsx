import { FC, useMemo } from 'react'

import {
    ratingToCSScolor,
    useMemberBadges,
    useMemberStats,
    UserBadge,
    UserBadgesResponse,
    UserProfile,
    UserStats,
} from '~/libs/core'

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

    const isCopilot: boolean
        = useMemo(() => !!memberStats?.COPILOT, [memberStats])

    // function handleOpenTCAchievements(): void {
    //     console.log('handleOpenTCAchievements')
    // }

    return (
        <div className={styles.container}>
            <h3>Achievements with Topcoder</h3>

            <div className={styles.achievementsWrap}>
                <div className={styles.achievement}>
                    <p>{tcoWins}</p>
                    <p>TCO Wins</p>
                </div>
                <div className={styles.achievement}>
                    <p>{memberStats?.wins || 0}</p>
                    <p>Challenge Wins</p>
                </div>
                <div className={styles.achievement}>
                    <span style={ratingToCSScolor(props.profile.maxRating?.rating || 0)}>
                        {props.profile.maxRating?.rating || 0}
                    </span>
                    <p>RATING</p>
                </div>
            </div>

            {
                isCopilot && (
                    <div className={styles.rolesWrap}>
                        <p className='body-main-bold'>Special Roles:&nbsp;</p>
                        <p>Copilot</p>
                    </div>
                )
            }
        </div>
    )
}

export default MemberTCAchievements
