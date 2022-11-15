import { FC } from 'react'
import classNames from 'classnames'

import styles from './Avatar.module.scss'

interface AvatarProps {
    containerClass?: string
    firstName?: string
    handle?: string
    lastName?: string
    photoUrl?: string
    size: 'sm' | 'xl'
}

const Avatar: FC<AvatarProps> = (props: AvatarProps) => {

    // if we don't have a profile and either a photo or an initial, just return an empty element
    if (!props.photoUrl && !props.firstName && !props.lastName) {
        return <></>
    }

    const avatarElement: JSX.Element = !!props.photoUrl
        ? (
            <img
                alt={`${props.handle} avatar`}
                className={classNames(styles.avatar, styles[props.size], styles['avatar-img'])}
                src={props.photoUrl}
            />
        )
        : (
            <span className={classNames(styles.avatar, styles['avatar-letters'], styles[props.size])}>
                {props.firstName?.charAt(0)}
                {props.lastName?.charAt(0)}
            </span>
        )

    return (
        <div className={classNames(styles['avatar-container'], styles[props.size], props.containerClass)}>
            {avatarElement}
        </div>
    )
}

export default Avatar
