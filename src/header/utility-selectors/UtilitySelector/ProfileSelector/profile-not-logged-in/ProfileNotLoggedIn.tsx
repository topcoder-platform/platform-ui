import classNames from 'classnames'
import { FC } from 'react'

import { RouteConfig } from '../../../../../config'
import { AuthenticationUrlConfig } from '../../../../../lib'
import '../../../../../lib/styles/index.scss'

import styles from './ProfileNotLoggedIn.module.scss'

const ProfileNotLoggedIn: FC<{}> = () => {

    const buttonClass: string = 'button'

    return (
        <>
            <a
                className={classNames(buttonClass, styles.login)}
                href={AuthenticationUrlConfig.login(RouteConfig.home)}
            >
                Log In
            </a>
            <a
                className={classNames(buttonClass, 'all-white', styles.signup)}
                href={AuthenticationUrlConfig.signup(RouteConfig.home)}
            >
                Sign Up
            </a>
        </>
    )
}

export default ProfileNotLoggedIn
