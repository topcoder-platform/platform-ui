import { FC } from 'react'

import { Button, loginUrl, routeRoot, signupUrl } from '../../../../../lib'
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
                url={loginUrl(routeRoot)}
            />
            <Button
                className={styles.signup}
                label='Sign Up'
                size='sm'
                buttonStyle='tertiary'
                url={signupUrl(routeRoot)}
            />
        </>
    )
}

export default ProfileNotLoggedIn
