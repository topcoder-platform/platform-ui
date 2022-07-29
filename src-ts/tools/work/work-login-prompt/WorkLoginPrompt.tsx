import { FC } from 'react'
import { useParams } from 'react-router-dom'

import {
    authUrl,
    authUrlLogin,
    authUrlSignup,
    Button,
} from '../../../lib'

import styles from './WorkLoginPrompt.module.scss'

const WorkLoginPrompt: FC = () => {

    const customReturnUrl: string | undefined = useParams().retUrl

    let urlLogIn: string = authUrlLogin
    let urlSignUp: string = authUrlSignup
    if (customReturnUrl) {
        urlLogIn = `${authUrl}?retUrl=${encodeURIComponent(customReturnUrl)}`
        urlSignUp = `${urlLogIn}&regSource=tcBusiness&mode=signUp`
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
                            url={urlLogIn}
                        />
                        <span className={styles['separator']}>OR</span>
                        <Button
                            label='SIGN UP'
                            url={urlSignUp}
                        />
                    </div>
                </div>
            </div>
        </>
    )
}

export default WorkLoginPrompt
