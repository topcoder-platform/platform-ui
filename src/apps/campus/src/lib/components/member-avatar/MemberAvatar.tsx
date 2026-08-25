/**
 * Member avatar, falling back to a placeholder when there is no usable photo.
 */
import { FC, useEffect, useState } from 'react'
import classNames from 'classnames'

import avatarPlaceholder from '../../assets/ic-user-placeholder.svg'

import styles from './MemberAvatar.module.scss'

interface MemberAvatarProps {
    readonly className?: string
    readonly photoURL?: string | null
}

export const MemberAvatar: FC<MemberAvatarProps> = (props: MemberAvatarProps) => {
    const [failed, setFailed] = useState<boolean>(false)
    const photoURL: string = props.photoURL?.trim() ?? ''

    // rows are reused as the leaderboard is filtered or paged
    useEffect(() => { setFailed(false) }, [photoURL])

    return (
        <img
            alt=''
            className={classNames(styles.avatar, props.className)}
            src={failed || !photoURL ? avatarPlaceholder : photoURL}
            onError={function onError() { setFailed(true) }}
        />
    )
}

export default MemberAvatar
