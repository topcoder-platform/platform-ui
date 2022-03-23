import { FC } from 'react'

import { authUrlLogin, authUrlSignup, Button, routeRoot } from '../../../../../lib'

import '../../../../../lib/styles/index.scss'

import styles from './ProfileNotLoggedIn.module.scss'

const ProfileNotLoggedIn: FC<{}> = () => {

    return (
        <>
            <Button
                buttonStyle='text'
                className={styles.login}
                label='Log In'
                size='sm'
                tabIndex={-1}
                url={authUrlLogin(routeRoot)}
            />
            <Button
                buttonStyle='tertiary'
                className={styles.signup}
                label='Sign Up'
                size='sm'
                tabIndex={-1}
                url={authUrlSignup(routeRoot)}
            />
        </>
    )
}

export default ProfileNotLoggedIn
