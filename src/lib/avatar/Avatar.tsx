import classNames from 'classnames'
import { FC } from 'react'

import styles from './Avatar.module.scss'

interface AvatarProps {
    firstName?: string
    handle?: string
    lastName?: string
    photoUrl?: string
}

const Avatar: FC<AvatarProps> = (props: AvatarProps) => {

    // if we don't have a profile and either a photo or an initial, just return an empty element
    if (!props.photoUrl && !props.firstName && !props.lastName) {
        return <></>
    }

    const avatarElement: JSX.Element = !!props.photoUrl
        ? (
            <img src={props.photoUrl} alt={`${props.handle} avatar`} className={styles.avatar} />
        )
        : (
            <span className={classNames(styles.avatar, styles['avatar-letters'])}>
                {props.firstName?.charAt(0)}
                {props.lastName?.charAt(0)}
            </span>
        )

    return (
        <div className={styles['avatar-container']}>
            {avatarElement}
        </div>
    )
}

export default Avatar
