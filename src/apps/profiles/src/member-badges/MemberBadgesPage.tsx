import { Dispatch, FC, SetStateAction, useCallback, useEffect, useState } from 'react'
import { Link, Params, useNavigate, useParams } from 'react-router-dom'
import { bind } from 'lodash'

import { profileGetPublicAsync, useMemberBadges, UserBadge, UserBadgesResponse, UserProfile } from '~/libs/core'
import { Button, ContentLayout, IconSolid, LoadingSpinner } from '~/libs/ui'

import { MemberBadgeModal } from '../components'

import styles from './MemberBadgesPage.module.scss'

const MemberBadgesPage: FC<{}> = () => {
    const routeParams: Params<string> = useParams()
    const navigate = useNavigate()

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

    const handleBackBtn = useCallback(() => {
        navigate(-1)
    }, [navigate])

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
                        <Button
                            link
                            size='lg'
                            iconToLeft
                            icon={IconSolid.ArrowLeftIcon}
                            onClick={handleBackBtn}
                        >
                            Return to profile
                        </Button>
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
                                        <div className={styles.badgeImageWrap}>
                                            <img
                                                src={badge.org_badge.badge_image_url}
                                                alt={`Topcoder community badge - ${badge.org_badge.badge_name}`}
                                                className={styles.badgeImage}
                                            />
                                        </div>
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
