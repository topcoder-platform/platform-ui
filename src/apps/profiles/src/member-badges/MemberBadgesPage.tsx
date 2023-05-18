import { Dispatch, FC, SetStateAction, useCallback, useEffect, useState } from 'react'
import { Link, Params, useParams } from 'react-router-dom'
import { bind } from 'lodash'

import { profileGetPublicAsync, useMemberBadges, UserBadge, UserBadgesResponse, UserProfile } from '~/libs/core'
import { ContentLayout, LoadingSpinner } from '~/libs/ui'

import { MemberBadgeModal } from '../components'

import styles from './MemberBadgesPage.module.scss'

const MemberBadgesPage: FC<{}> = () => {
    const routeParams: Params<string> = useParams()

    const [profile, setProfile]: [
        UserProfile | undefined,
        Dispatch<SetStateAction<UserProfile | undefined>>
    ] = useState()

    const [profileReady, setProfileReady]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    const memberBadges: UserBadgesResponse | undefined = useMemberBadges(profile?.userId as number, { limit: 100 })

    const [isBadgeDetailsOpen, setIsBadgeDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [selectedBadge, setSelectedBadge]: [UserBadge | undefined, Dispatch<SetStateAction<UserBadge | undefined>>]
        = useState<UserBadge | undefined>(undefined)

    const onBadgeClick: (badge: UserBadge) => void = useCallback((badge: UserBadge) => {
        setIsBadgeDetailsOpen(true)
        setSelectedBadge(badge)
    }, [])

    useEffect(() => {
        if (routeParams.memberHandle) {
            profileGetPublicAsync(routeParams.memberHandle)
                .then(userProfile => {
                    setProfile(userProfile)
                    setProfileReady(true)
                })
            // TODO: NOT FOUND PAGE redirect/dispaly via catch
        }
    }, [routeParams.memberHandle])

    function handleMemberBadgeModalClose(): void {
        setIsBadgeDetailsOpen(false)
    }

    return (
        <>
            <LoadingSpinner hide={profileReady && !!memberBadges} />

            {profileReady && profile && !!memberBadges && (
                <ContentLayout
                    outerClass={styles.container}
                >
                    <div className={styles.backLink}>
                        <svg
                            xmlns='http://www.w3.org/2000/svg'
                            width='14'
                            height='12'
                            fill='none'
                            viewBox='0 0 14 12'
                        >
                            <path
                                fill='#137D60'
                                fillRule='evenodd'
                                // eslint-disable-next-line max-len
                                d='M6.766 11.366a.8.8 0 01-1.132 0l-4.8-4.8a.8.8 0 010-1.132l4.8-4.8a.8.8 0 111.132 1.132L3.33 5.2h9.27a.8.8 0 010 1.6H3.33l3.435 3.434a.8.8 0 010 1.132z'
                                clipRule='evenodd'
                            />
                        </svg>
                        <Link to={`/profiles/${profile?.handle}`}>Return to Profile</Link>
                    </div>

                    <div className={styles.badgesWrapper}>
                        <h3>COMMUNITY AWARDS & HONORS</h3>

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
                    </div>
                </ContentLayout>
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
        </>
    )
}

export default MemberBadgesPage
