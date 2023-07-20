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
import { ChallengeWinsBanner } from './ChallengeWinsBanner'
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

    return memberStats?.wins || tcoWins ? (
        <div className={styles.container}>
            <p className='body-large-medium'>Achievements @ Topcoder</p>

            <div className={styles.achievementsWrap}>
                {
                    tcoWins > 0 && (
                        <TCOWinsBanner tcoWins={tcoWins} />
                    )
                }
                {
                    !!memberStats?.wins && memberStats.wins > 0 && (
                        <ChallengeWinsBanner
                            memberStats={memberStats}
                            profile={props.profile}
                        />
                    )
                }
            </div>

            {
                isCopilot && (
                    <div className={styles.rolesWrap}>
                        <p className='body-main-bold'>Special Roles:&nbsp;</p>
                        <p>Copilot</p>
                    </div>
                )
            }

            <CommunityAwards profile={props.profile} />
        </div>
    ) : <></>
}

export default MemberTCAchievements
