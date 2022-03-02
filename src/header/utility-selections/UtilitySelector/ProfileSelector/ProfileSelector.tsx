import classNames from 'classnames'
import { FC } from 'react'

import { RouteConfig } from '../../../../config'
import { AuthenticationUrlConfig, Avatar } from '../../../../lib'
import '../../../../lib/styles/index.scss'
import { HeaderProps } from '../../../models'

import styles from './ProfileSelector.module.scss'

const ProfileSelector: FC<HeaderProps> = (props: HeaderProps) => {

    // if we're not initialized, don't render anything
    if (!props?.initialized) {
        return <></>
    }

    const buttonClass: string = 'button'
    const authEndpoints: AuthenticationUrlConfig = new AuthenticationUrlConfig()
    const routes: RouteConfig = new RouteConfig()

    const avatar: JSX.Element = <Avatar
        firstName={props.profile?.firstName}
        lastName={props.profile?.lastName}
        handle={props.profile?.handle}
        photoUrl={props.profile?.photoURL}
    />
    const logIn: JSX.Element = (
        <a href={authEndpoints.login(routes.home)} className={buttonClass}>
            Log In
        </a>
    )
    const signUp: JSX.Element = (
        <a href={authEndpoints.signup(routes.home)} className={classNames(buttonClass, 'allWhite')}>
            Sign Up
        </a>
    )

    const isLoggedIn: boolean = !!props.profile
    return (
        <div className={styles['profile-selector']}>
            {!isLoggedIn && logIn}
            {!isLoggedIn && signUp}
            {isLoggedIn && avatar}
        </div>
    )
}

export default ProfileSelector
