/* eslint-disable react/jsx-no-bind */
/** Rating-colored member profile link. */
import { CSSProperties, FC } from 'react'

import { EnvironmentConfig } from '~/config'

import styles from './MemberHandle.module.scss'

export interface MemberHandleProps {
    color?: string
    handle: string
}

/**
 * Links a safely encoded handle to the canonical member profile.
 *
 * @param props member handle and API-provided platform color.
 * @returns profile link.
 * @throws Does not throw.
 */
export const MemberHandle: FC<MemberHandleProps> = props => {
    const style: CSSProperties | undefined = props.color
        ? { color: props.color }
        : undefined

    return (
        <a
            className={styles.handle}
            href={`${EnvironmentConfig.URLS.USER_PROFILE}/${encodeURIComponent(props.handle)}`}
            onClick={event => event.stopPropagation()}
            rel='noopener noreferrer'
            style={style}
            target='_blank'
        >
            {props.handle}
        </a>
    )
}
