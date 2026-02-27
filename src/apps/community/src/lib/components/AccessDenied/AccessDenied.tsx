import { FC, useCallback } from 'react'

import { authUrlLogin } from '~/libs/core'
import { Button, TcLogoSvg } from '~/libs/ui'

import styles from './AccessDenied.module.scss'

export enum AccessDeniedCause {
    NOT_AUTHENTICATED = 'NOT_AUTHENTICATED',
    NOT_AUTHORIZED = 'NOT_AUTHORIZED',
}

export interface AccessDeniedProps {
    cause: AccessDeniedCause
    communityId?: string
}

/**
 * Renders a standardized access denied view for authentication/authorization failures.
 *
 * @param props Access denied cause with optional community id for login attribution.
 * @returns Access denied message with contextual action.
 */
const AccessDenied: FC<AccessDeniedProps> = (props: AccessDeniedProps) => {
    const handleLogin = useCallback((): void => {
        window.location.assign(authUrlLogin(window.location.href))
    }, [])
    const handleBackToHome = useCallback((): void => {
        window.location.assign('/')
    }, [])

    if (props.cause === AccessDeniedCause.NOT_AUTHENTICATED) {
        return (
            <section className={styles.container}>
                <TcLogoSvg className={styles.logo} />
                <h1 className={styles.title}>Access Denied</h1>
                <p className={styles.message}>
                    You must be authenticated to access this page.
                </p>
                {props.communityId && (
                    <p className={styles.meta}>
                        Community:
                        {' '}
                        {props.communityId}
                    </p>
                )}
                <Button
                    label='Log In Here'
                    onClick={handleLogin}
                    primary
                />
            </section>
        )
    }

    return (
        <section className={styles.container}>
            <TcLogoSvg className={styles.logo} />
            <h1 className={styles.title}>Not Authorized</h1>
            <p className={styles.message}>
                You are not authorized to access this page.
            </p>
            <Button
                label='Back to Home'
                onClick={handleBackToHome}
                secondary
            />
        </section>
    )
}

export default AccessDenied
