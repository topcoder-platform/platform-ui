import classNames from 'classnames'
import { FC, useContext } from 'react'

import { RouteConfig } from '../../../../config'
import { AuthenticationUrlConfig, Avatar, ProfileContext, ProfileContextData } from '../../../../lib'
import '../../../../lib/styles/index.scss'

import styles from './ProfileSelector.module.scss'

const ProfileSelector: FC<{}> = () => {

    const { initialized, profile }: ProfileContextData =  useContext(ProfileContext)

    // if we're not initialized, don't render anything
    if (!initialized) {
        return <></>
    }

    const buttonClass: string = 'button'
    const authEndpoints: AuthenticationUrlConfig = new AuthenticationUrlConfig()
    const routes: RouteConfig = new RouteConfig()

    const avatar: JSX.Element = <Avatar
        firstName={profile?.firstName}
        lastName={profile?.lastName}
        handle={profile?.handle}
        photoUrl={profile?.photoURL}
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

    const isLoggedIn: boolean = !!profile
    return (
        <div className={styles['profile-selector']}>
            {!isLoggedIn && logIn}
            {!isLoggedIn && signUp}
            {isLoggedIn && avatar}
        </div>
    )
}

export default ProfileSelector
