import { FC } from 'react'
import { NavigateFunction, useNavigate } from 'react-router-dom'

import config from '../../../../config'
import { Button } from '../../../lib'

import styles from './WorkLoginPrompt.module.scss'

export interface WorkLoginPromptProps {
    isLoggedIn: boolean,
    nextPageUrl: string,
}

const WorkLoginPrompt: FC<WorkLoginPromptProps> = (props: WorkLoginPromptProps) => {
    const { isLoggedIn, nextPageUrl }: WorkLoginPromptProps = props
    const navigate: NavigateFunction = useNavigate()

    if (isLoggedIn) {
        navigate(nextPageUrl)
        return <></>
    }

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
