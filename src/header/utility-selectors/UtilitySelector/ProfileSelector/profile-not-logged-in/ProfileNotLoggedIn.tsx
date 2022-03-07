import classNames from 'classnames'
import { FC } from 'react'

import { RouteConfig } from '../../../../../config'
import { AuthenticationUrlConfig } from '../../../../../lib'
import '../../../../../lib/styles/index.scss'

import styles from './ProfileNotLoggedIn.module.scss'

const ProfileNotLoggedIn: FC<{}> = () => {

    const buttonClass: string = 'button'
    const authEndpoints: AuthenticationUrlConfig = new AuthenticationUrlConfig()
    const routes: RouteConfig = new RouteConfig()

    return (
        <>
            <a
                className={classNames(buttonClass, styles.login)}
                href={authEndpoints.login(routes.home)}
            >
                Log In
            </a>
            <a
                className={classNames(buttonClass, 'all-white', styles.signup)}
                href={authEndpoints.signup(routes.home)}
            >
                Sign Up
            </a>
        </>
    )
}

export default ProfileNotLoggedIn
