import classNames from 'classnames'
import { FC } from 'react'

import { UserProfile } from '../interfaces'

import styles from './Avatar.module.scss'

interface AvatarProps {
    profile?: UserProfile
}

const Avatar: FC<AvatarProps> = (props: AvatarProps) => {

    const profile: UserProfile | undefined = props.profile

    // if we don't have a profile and either a photo or an initial, just return an empty element
    if (!profile || (!profile.photoURL && !profile.firstName && !profile.lastName)) {
        return <></>
    }

    const avatarElement: JSX.Element = !!profile.photoURL
        ? (
            <img src={profile.photoURL} alt={`${profile.handle} avatar`} className={styles.avatar} />
        )
        : (
            <span className={classNames(styles.avatar, styles['avatar-letters'])}>
                {profile.firstName?.charAt(0)}
                {profile.lastName?.charAt(0)}
            </span>
        )

    return (
        <div className={styles['avatar-container']}>
            {avatarElement}
        </div>
    )
}

export default Avatar
