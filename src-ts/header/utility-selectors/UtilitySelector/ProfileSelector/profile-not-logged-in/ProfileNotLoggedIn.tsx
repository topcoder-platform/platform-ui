import { FC, useContext } from 'react'

import { authUrlLogin, authUrlSignup, Button, routeContext, RouteContextData } from '../../../../../lib'
import '../../../../../lib/styles/index.scss'

import styles from './ProfileNotLoggedIn.module.scss'

const ProfileNotLoggedIn: FC<{}> = () => {

    const { rootLoggedInRoute }: RouteContextData = useContext(routeContext)

    return (
        <>
            <Button
                buttonStyle='text'
                className={styles.login}
                label='Log In'
                size='md'
                tabIndex={-1}
                url={authUrlLogin(rootLoggedInRoute)}
            />
            <Button
                buttonStyle='tertiary'
                className={styles.signup}
                label='Sign Up'
                size='md'
                tabIndex={-1}
                url={authUrlSignup(rootLoggedInRoute)}
            />
        </>
    )
}

export default ProfileNotLoggedIn
