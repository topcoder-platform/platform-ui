import { FC, useContext } from 'react'
import { Location, useLocation, useParams } from 'react-router-dom'

import {
    authUrlLogin,
    Button,
    routeContext,
    RouteContextData,
    useSignUp,
} from '../../../lib'

import styles from './WorkLoginPrompt.module.scss'

const WorkLoginPrompt: FC = () => {

    const routeData: RouteContextData = useContext(routeContext)
    const location: Location = useLocation()
    const customReturnUrl: string | undefined = useParams().retUrl

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
                            url={authUrlLogin(customReturnUrl)}
                        />
                        <span className={styles['separator']}>OR</span>
                        <Button
                            label='SIGN UP'
                            onClick={() => useSignUp(location.pathname, routeData.toolsRoutes, customReturnUrl)}
                        />
                    </div>
                </div>
            </div>
        </>
    )
}

export default WorkLoginPrompt
