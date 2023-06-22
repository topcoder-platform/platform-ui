import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'
import moment from 'moment'

import { getVerificationStatusAsync, UserProfile } from '~/libs/core'
import { Button, FormToggleSwitch, VerifiedMemberBadge } from '~/libs/ui'

import styles from './ProfileHeader.module.scss'

interface ProfileHeaderProps {
    profile: UserProfile
    authProfile: UserProfile | undefined
}

const DEFAULT_MEMBER_AVATAR: string
    = 'https://d1aahxkjiobka8.cloudfront.net/static-assets/images/ab4a084a9815ebb1cf8f7b451ce4c88f.svg'

const ProfileHeader: FC<ProfileHeaderProps> = (props: ProfileHeaderProps) => {
    // const photoURL: string = props.profile.photoURL || DEFAULT_MEMBER_AVATAR
    const photoURL: string = DEFAULT_MEMBER_AVATAR

    const [isMemberVerified, setIsMemberVerified]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const canEdit: boolean = props.authProfile?.handle === props.profile.handle

    useEffect(() => {
        if (!props.profile?.handle) {
            return
        }

        getVerificationStatusAsync(props.profile.handle)
            .then(verified => setIsMemberVerified(verified))
    }, [props.profile.handle])

    function handleHireMeClick(): void {
        console.log('Hire Me button clicked')
    }

    function handleToggleAvailableForGigs(): void {
        console.log('Available for Gigs toggle clicked')
    }

    return (
        <div className={styles.container}>
            <img src={photoURL} alt='Topcoder - Member Profile Avatar' className={styles.profilePhoto} />

            <div className={styles.profileInfo}>
                <p className='body-large-bold'>
                    {props.profile.firstName}
                    {' '}
                    {props.profile.lastName}
                </p>

                <p className={styles.memberSince}>
                    {props.profile.handle}
                    {' '}
                    |
                    {' '}
                    Member Since
                    {' '}
                    {moment(props.profile.createdAt)
                        .format('MMM YYYY')}
                </p>

                {
                    isMemberVerified ? (
                        <VerifiedMemberBadge containerClass={styles.verified} />
                    ) : undefined
                }
            </div>

            <div className={styles.profileActions}>
                <div className={styles.availableForGigs}>
                    <FormToggleSwitch
                        name='availableForGigs'
                        onChange={handleToggleAvailableForGigs}
                        value={false}
                        disabled={!canEdit}
                    />
                    <p className='body-ultra-small'>Available for Gigs</p>
                </div>
                <Button
                    label='Hire Me'
                    primary
                    onClick={handleHireMeClick}
                />
            </div>
        </div>
    )
}

export default ProfileHeader
