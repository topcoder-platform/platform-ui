import { CSSProperties, FC } from 'react'
import classNames from 'classnames'

import { UserProfile } from '~/libs/core'

import styles from './ProfilePicture.module.scss'

interface ProfilePictureProps {
    className?: string
    member: Pick<UserProfile, 'firstName'|'lastName'|'photoURL'>
}

const ProfilePicture: FC<ProfilePictureProps> = props => (
    <div
        className={classNames(props.className, styles.profilePic)}
        style={{ '--background-image-url': `url(${props.member.photoURL})` } as CSSProperties}
    >
        <span className={styles.profileInitials}>
            {props.member.firstName.slice(0, 1)}
            {props.member.lastName.slice(0, 1)}
        </span>
        <img src={props.member.photoURL} alt='' />
    </div>
)

export default ProfilePicture
