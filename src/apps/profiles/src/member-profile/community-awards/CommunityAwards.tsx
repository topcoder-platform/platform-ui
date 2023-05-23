import { Dispatch, FC, SetStateAction, useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { bind } from 'lodash'

import { useMemberBadges, UserBadge, UserBadgesResponse, UserProfile } from '~/libs/core'

import { MemberBadgeModal } from '../../components'

import styles from './CommunityAwards.module.scss'

interface CommunityAwardsProps {
    profile: UserProfile | undefined
}

const CommunityAwards: FC<CommunityAwardsProps> = (props: CommunityAwardsProps) => {
    const memberBadges: UserBadgesResponse | undefined = useMemberBadges(props.profile?.userId as number, { limit: 4 })

    const [isBadgeDetailsOpen, setIsBadgeDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [selectedBadge, setSelectedBadge]: [UserBadge | undefined, Dispatch<SetStateAction<UserBadge | undefined>>]
        = useState<UserBadge | undefined>(undefined)

    const onBadgeClick: (badge: UserBadge) => void = useCallback((badge: UserBadge) => {
        setIsBadgeDetailsOpen(true)
        setSelectedBadge(badge)
    }, [])

    return memberBadges && memberBadges.count ? (
        <div className={styles.container}>
            <div className={styles.title}>
                <h3>Community Awards & Honors</h3>
                <Link to='badges' className={styles.viewAllLink}>View all badges</Link>
            </div>

            <div className={styles.badges}>
                {
                    memberBadges.rows.map(badge => (
                        <div
                            key={badge.org_badge_id}
                            className={styles.badgeCard}
                            onClick={bind(onBadgeClick, this, badge)}
                        >
                            <img
                                src={badge.org_badge.badge_image_url}
                                alt={`Topcoder community badge - ${badge.org_badge.badge_name}`}
                                className={styles.badgeImage}
                            />
                            <span className={styles.badgeTitle}>{badge.org_badge.badge_name}</span>
                        </div>
                    ))
                }
            </div>

            {
                selectedBadge && (
                    <MemberBadgeModal
                        isBadgeDetailsOpen={isBadgeDetailsOpen}
                        onClose={bind(setIsBadgeDetailsOpen, this, false)}
                        selectedBadge={selectedBadge}
                    />
                )
            }
        </div>
    ) : <></>
}

export default CommunityAwards
