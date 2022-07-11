import { FC } from 'react'

import { authUrlLogin, authUrlSignup, Button } from '../../../../../lib'
import '../../../../../lib/styles/index.scss'

import styles from './ProfileNotLoggedIn.module.scss'

const ProfileNotLoggedIn: FC<{}> = () => {

    return (
        <>
            <Button
                buttonStyle='text'
                className={styles.login}
                label='Log In'
                size='md'
                tabIndex={-1}
                url={authUrlLogin}
            />
            <Button
                buttonStyle='tertiary'
                className={styles.signup}
                label='Sign Up'
                size='md'
                tabIndex={-1}
                url={authUrlSignup()}
            />
        </>
    )
}

export default ProfileNotLoggedIn
