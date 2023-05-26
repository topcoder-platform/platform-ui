import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'

import { getVerificationStatusAsync, UserProfile } from '~/libs/core'
import { ContentLayout, VerifiedMemberBadge } from '~/libs/ui'

import styles from './ProfilePageJumbo.module.scss'

const DEFAULT_MEMBER_AVATAR: string
    = 'https://d1aahxkjiobka8.cloudfront.net/static-assets/images/ab4a084a9815ebb1cf8f7b451ce4c88f.svg'

interface ProfilePageJumboProps {
    profile: UserProfile
}

const ProfilePageJumbo: FC<ProfilePageJumboProps> = (props: ProfilePageJumboProps) => {
    const photoURL: string = props.profile.photoURL || DEFAULT_MEMBER_AVATAR
    const [isMemberVerified, setIsMemberVerified]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    useEffect(() => {
        if (!props.profile) {
            return
        }

        getVerificationStatusAsync(props.profile.handle)
            .then(verified => setIsMemberVerified(verified))
    }, [props.profile])

    return (
        <div className={styles.container}>
            <ContentLayout
                contentClass={styles.contentWrap}
                outerClass={styles.outerContentWrap}
                innerClass={styles.innerContentWrap}
            >
                <img src={photoURL} alt='Topcoder - Member Profile Avatar' className={styles.profilePhoto} />
                <div>
                    <div className={styles.handle}>{props.profile.handle}</div>
                    {
                        isMemberVerified ? (
                            <VerifiedMemberBadge />
                        ) : undefined
                    }
                </div>
            </ContentLayout>
        </div>
    )
}

export default ProfilePageJumbo
