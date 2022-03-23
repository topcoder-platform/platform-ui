import { FC } from 'react'

<<<<<<< HEAD
import { Button, loginUrl, routeRoot, signupUrl } from '../../../../../lib'
=======
import { authUrlLogin, authUrlSignup, Button, routeRoot } from '../../../../../lib'
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22
import '../../../../../lib/styles/index.scss'

import styles from './ProfileNotLoggedIn.module.scss'

const ProfileNotLoggedIn: FC<{}> = () => {

    return (
        <>
            <Button
<<<<<<< HEAD
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
=======
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
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22
            />
        </>
    )
}

export default ProfileNotLoggedIn
