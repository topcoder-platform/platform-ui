import { FC, useCallback, useState } from 'react'
import classNames from 'classnames'

import { getMemberAvatarInitial, getMemberAvatarPalette } from '../utils/member-avatar.utils'

import styles from './MemberAvatar.module.scss'

interface MemberAvatarProps {
    /** Host layout class for size, spacing, or photo border overrides. */
    className?: string
    /** Member handle that drives the placeholder initial and color. */
    handle?: string
    /** Public Members API photo; omitted or failed photos use the placeholder. */
    photoURL?: string
}

/**
 * Renders a decorative member avatar for the Opportunities (community) app.
 * Members with a usable photo show that photo; members without one, or whose
 * photo fails to load, show the borderless Figma placeholder: the handle's
 * first initial on a color pair chosen consistently from the handle.
 *
 * Used by challenge registrant/submission/winner rows, forum members and
 * participants, completed competition cards, and review applications. The
 * avatar is hidden from assistive technology because each host renders the
 * member's handle as accessible text beside or around it.
 *
 * @param props member handle, optional photo URL, and optional host class.
 * @returns a circular photo or initial placeholder.
 * @throws Does not throw; image failures switch to the placeholder.
 */
export const MemberAvatar: FC<MemberAvatarProps> = props => {
    const [failedPhotoURL, setFailedPhotoURL] = useState<string>()
    const photoURL = props.photoURL
    const showPhoto = !!photoURL && photoURL !== failedPhotoURL
    const handlePhotoError = useCallback((): void => setFailedPhotoURL(photoURL), [photoURL])

    return (
        <span
            aria-hidden='true'
            className={classNames(
                styles.avatar,
                !showPhoto && [styles.placeholder, styles[getMemberAvatarPalette(props.handle)]],
                props.className,
            )}
        >
            {showPhoto
                ? <img alt='' onError={handlePhotoError} src={photoURL} />
                : getMemberAvatarInitial(props.handle)}
        </span>
    )
}
