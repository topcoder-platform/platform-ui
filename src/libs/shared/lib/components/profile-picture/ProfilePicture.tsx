import { CSSProperties, FC, useState } from 'react'
import classNames from 'classnames'

import { UserProfile } from '~/libs/core'

import styles from './ProfilePicture.module.scss'

interface ProfilePictureProps {
    className?: string
    member: Pick<UserProfile, 'firstName'|'lastName'|'photoURL'>
}

const ProfilePicture: FC<ProfilePictureProps> = props => {
    const [error, setError] = useState(false)
    const [loaded, setLoaded] = useState(false)

    function onImgLoad(): void {
        setLoaded(true)
    }

    function onImgError(): void {
        setError(true)
    }

    return (
        <div
            className={classNames(props.className, styles.profilePic, loaded && styles.imgLoaded)}
            style={{ '--background-image-url': `url(${props.member.photoURL})` } as CSSProperties}
        >
            {!loaded && (
                <span className={styles.profileInitials}>
                    {props.member.firstName.slice(0, 1)}
                    {props.member.lastName.slice(0, 1)}
                </span>
            )}
            {props.member.photoURL && !error && (
                <img src={props.member.photoURL} alt='' onLoad={onImgLoad} onError={onImgError} />
            )}
        </div>
    )
}

export default ProfilePicture
