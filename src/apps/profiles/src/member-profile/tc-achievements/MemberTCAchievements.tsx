import { Dispatch, FC, SetStateAction, useMemo, useState } from 'react'

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
import MemberRolesInfoModal from './MemberRolesInfoModal/MemberRolesInfoModal'
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

    const isCopilot: boolean
        = useMemo(() => !!memberStats?.COPILOT, [memberStats])

    const [isInfoModalOpen, setIsInfoModalOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState(false)

    function handleInfoModalClose(): void {
        setIsInfoModalOpen(false)
    }

    function handleInfoModalOpen(): void {
        setIsInfoModalOpen(true)
    }

    return memberStats?.wins || tcoWins || tcoQualifications ? (
        <div className={styles.container}>
            <p className='body-large-medium'>Achievements @ Topcoder</p>

            <div className={styles.achievementsWrap}>
                {
                    (tcoWins > 0 || tcoQualifications > 0 || tcoTrips > 0) && (
                        <TCOWinsBanner tcoWins={tcoWins} tcoQualifications={tcoQualifications} tcoTrips={tcoTrips} />
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
                    <div className={styles.rolesSection}>
                        <div className={styles.rolesWrap}>
                            <p className='body-main-medium'>Topcoder Special Roles:&nbsp;</p>
                            <p>Copilot</p>
                        </div>
                        <button type='button' className={styles.link} onClick={handleInfoModalOpen}>
                            What are special roles?
                        </button>

                        {
                            isInfoModalOpen && (
                                <MemberRolesInfoModal
                                    onClose={handleInfoModalClose}
                                />
                            )
                        }
                    </div>
                )
            }

            <CommunityAwards profile={props.profile} />
        </div>
    ) : <></>
}

export default MemberTCAchievements
