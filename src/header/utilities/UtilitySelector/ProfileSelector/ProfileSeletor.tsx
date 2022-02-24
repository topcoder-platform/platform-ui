import classNames from 'classnames'
import { FC } from 'react'

import '../../../../lib/styles/index.scss'
import { UiRoute } from '../../../../lib/urls'

import avatarImage from './duck.png'
import styles from './ProfileSelector.module.scss'

const ProfileSelector: FC<{}> = () => {

    const routes: UiRoute = new UiRoute()

    // TODO: get this from the authentication and user profile service, respectively
    const isLoggedIn: boolean = true

    const logIn: JSX.Element | undefined = isLoggedIn ? undefined : (<a href={routes.login} className='button'>Log In</a>)
    const signUp: JSX.Element | undefined = isLoggedIn ? undefined : (<a href={routes.signup} className={classNames('button', 'allWhite')}>Sign Up</a>)
    const avatar: JSX.Element | undefined = isLoggedIn ? (<img src={avatarImage} className={styles.avatar} />) : undefined
    return (
        <div className={styles['profile-selector']}>
            {logIn}
            {signUp}
            {avatar}
        </div>
    )
}

export default ProfileSelector
