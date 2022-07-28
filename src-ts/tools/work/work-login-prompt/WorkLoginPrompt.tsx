import { FC } from 'react'

import config from '../../../../config'
import { Button } from '../../../lib'

import styles from './WorkLoginPrompt.module.scss'

const WorkLoginPrompt: FC = () => {
    // TODO: I removed the old logic for nextUrl and isLoggedIn ebcuase we are handling redirects in the intake forms
    // and we won't necessarily have that data in works.routes
    // Yet, we may still need to circle back here because I haven't handled telling auth0 where to go next after a log in.
    // If we do need the logic in this component, we can call isLoggedIn from Context, and import the routes for worktypes to determine the next route.

    const onLogin: () => void = () => {
        window.location.href = config.SIGN_IN_URL
    }

    const onSignUp: () => void = () => {
        window.location.href = config.SIGN_UP_URL
    }

    return (
        <>
            <div className={styles.container}>
                <div className='body-main'>
                    <h2>
                        Log in or create an account
                    </h2>
                    <p>
                        You are about to share secured information. To ensure your
                        security, please log in or create an account.
                    </p>

                    <div className={styles['btn']}>
                        <Button
                            label='LOG IN'
                            onClick={onLogin}
                        />
                        <span className={styles['separator']}>OR</span>
                        <Button
                            label='SIGN UP'
                            onClick={onSignUp}
                        />
                    </div>
                </div>
            </div>
        </>
    )
}

export default WorkLoginPrompt
