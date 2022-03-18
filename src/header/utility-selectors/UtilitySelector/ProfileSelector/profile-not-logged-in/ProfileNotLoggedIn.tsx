import { FC } from 'react'

import { authUrlLogin, authUrlSignup, Button, routeRoot } from '../../../../../lib'
import '../../../../../lib/styles/index.scss'

import styles from './ProfileNotLoggedIn.module.scss'

const ProfileNotLoggedIn: FC<{}> = () => {

    return (
        <>
            <Button
                className={styles.login}
                label='Log In'
                size='sm'
                buttonStyle='text'
                url={authUrlLogin(routeRoot)}
            />
            <Button
                className={styles.signup}
                label='Sign Up'
                size='sm'
                buttonStyle='tertiary'
                url={authUrlSignup(routeRoot)}
            />
        </>
    )
}

export default ProfileNotLoggedIn
