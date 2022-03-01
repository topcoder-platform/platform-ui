import classNames from 'classnames'
import { FC } from 'react'

import { Avatar, ExternalEndpoint, HeaderProps, UiRoute } from '../../../../lib'
import '../../../../lib/styles/index.scss'

import styles from './ProfileSelector.module.scss'

const ProfileSelector: FC<HeaderProps> = (props: HeaderProps) => {

    // if we're not initialized, don't render anything
    if (!props.initialized) {
        return <></>
    }

    const buttonClass: string = 'button'
    const externalEndpoints: ExternalEndpoint = new ExternalEndpoint()
    const routes: UiRoute = new UiRoute()

    const avatar: JSX.Element = <Avatar profile={props.profile} />
    const logIn: JSX.Element = (
        <a href={externalEndpoints.login(routes.home)} className={buttonClass}>
            Log In
        </a>
    )
    const signUp: JSX.Element = (
        <a href={externalEndpoints.signup(routes.home)} className={classNames(buttonClass, 'allWhite')}>
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
