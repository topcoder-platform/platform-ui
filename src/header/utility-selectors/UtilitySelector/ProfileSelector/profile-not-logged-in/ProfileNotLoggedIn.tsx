import { FC } from 'react'

import { AuthenticationUrlConfig, Button, routeRoot } from '../../../../../lib'
import '../../../../../lib/styles/index.scss'

import styles from './ProfileNotLoggedIn.module.scss'

const ProfileNotLoggedIn: FC<{}> = () => {

    return (
        <>
            <Button
                className={styles.login}
                label='Log In'
                size='sm'
                type='text'
                url={AuthenticationUrlConfig.login(routeRoot)}
            />
            <Button
                className={styles.signup}
                label='Sign Up'
                size='sm'
                type='tertiary'
                url={AuthenticationUrlConfig.signup(routeRoot)}
            />
        </>
    )
}

export default ProfileNotLoggedIn
