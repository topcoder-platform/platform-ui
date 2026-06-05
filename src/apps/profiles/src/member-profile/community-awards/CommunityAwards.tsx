import { Dispatch, FC, SetStateAction, useCallback, useEffect, useState } from 'react'
import { bind } from 'lodash'

import { useMemberBadges, UserBadge, UserBadgesResponse, UserProfile } from '~/libs/core'
import { Tooltip } from '~/libs/ui'

import { MemberBadgeModal } from '../../components'

import styles from './CommunityAwards.module.scss'

const COLLAPSED_BADGE_COUNT = 4

interface CommunityAwardsProps {
    profile: UserProfile | undefined
}

const CommunityAwards: FC<CommunityAwardsProps> = (props: CommunityAwardsProps) => {
    const memberBadges: UserBadgesResponse | undefined = useMemberBadges(props.profile?.userId as number, {
        limit: 500,
    })

    const [isBadgeDetailsOpen, setIsBadgeDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [isAwardsExpanded, setIsAwardsExpanded]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [selectedBadge, setSelectedBadge]: [UserBadge | undefined, Dispatch<SetStateAction<UserBadge | undefined>>]
        = useState<UserBadge | undefined>(undefined)

    const onBadgeClick: (badge: UserBadge) => void = useCallback((badge: UserBadge) => {
        setIsBadgeDetailsOpen(true)
        setSelectedBadge(badge)
    }, [])

    useEffect(() => {
        setIsAwardsExpanded(false)
    }, [props.profile?.userId])

    function handleAwardsExpandClick(): void {
        setIsAwardsExpanded(true)
    }

    function handleMemberBadgeModalClose(): void {
        setIsBadgeDetailsOpen(false)
    }

    const badges: UserBadge[] = memberBadges?.rows ?? []
    const visibleBadges: UserBadge[] = isAwardsExpanded
        ? badges
        : badges.slice(0, COLLAPSED_BADGE_COUNT)
    const additionalBadgeCount: number = Math.max((memberBadges?.count ?? badges.length) - COLLAPSED_BADGE_COUNT, 0)

    return badges.length ? (
        <div className={styles.container}>
            <div className={styles.title}>
                <p className='body-main-bold'>Awards</p>
            </div>

            <div className={styles.badges}>
                {
                    visibleBadges.map(badge => (
                        <Tooltip
                            content={badge.org_badge.badge_name}
                            key={badge.org_badge_id}
                            place='top'
                        >
                            <button
                                aria-label={`View ${badge.org_badge.badge_name} award details`}
                                className={styles.badgeButton}
                                onClick={bind(onBadgeClick, this, badge)}
                                type='button'
                            >
                                <img
                                    src={badge.org_badge.badge_image_url}
                                    alt={`Topcoder community badge - ${badge.org_badge.badge_name}`}
                                    className={styles.badgeImage}
                                />
                            </button>
                        </Tooltip>
                    ))
                }
            </div>

            {!isAwardsExpanded && additionalBadgeCount > 0 && (
                <button
                    className={styles.moreBadgesButton}
                    onClick={handleAwardsExpandClick}
                    type='button'
                >
                    {`+ ${additionalBadgeCount} more ${additionalBadgeCount === 1 ? 'badge' : 'badges'}`}
                </button>
            )}

            {
                selectedBadge && (
                    <MemberBadgeModal
                        isBadgeDetailsOpen={isBadgeDetailsOpen}
                        onClose={handleMemberBadgeModalClose}
                        selectedBadge={selectedBadge}
                    />
                )
            }
        </div>
    ) : <></>
}

export default CommunityAwards
