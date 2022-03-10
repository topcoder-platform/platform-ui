import classNames from 'classnames'
import { FC } from 'react'

import { AuthenticationUrlConfig, routeRoot } from '../../../../../lib'
import '../../../../../lib/styles/index.scss'

import styles from './ProfileNotLoggedIn.module.scss'

const ProfileNotLoggedIn: FC<{}> = () => {

    const buttonClass: string = 'button'

    return (
        <>
            <a
                className={classNames(buttonClass, styles.login)}
                href={AuthenticationUrlConfig.login(routeRoot)}
            >
                Log In
            </a>
            <a
                className={classNames(buttonClass, 'all-white', styles.signup)}
                href={AuthenticationUrlConfig.signup(routeRoot)}
            >
                Sign Up
            </a>
        </>
    )
}

export default ProfileNotLoggedIn
