import { FC, useContext, useEffect } from 'react'
import { Location, NavigateFunction, useLocation, useNavigate, useParams } from 'react-router-dom'

import {
    Button,
    PageDivider,
    BackArrowIcon,
} from '~/libs/ui'
import { RouterContextData, authUrlLogin, routerContext } from '~/libs/core'

import { ROUTES } from '../../config'

import styles from './WorkLoginPrompt.module.scss'
import { setProgressItem } from '../../actions/progress'

interface WorkLoginPromptProps {
  isLoggedIn?: boolean
  previousPageUrl: string
  nextPageUrl?: string
}

const WorkLoginPrompt: FC<WorkLoginPromptProps> = props => {

    const routeData: RouterContextData = useContext(routerContext)
    const location: Location = useLocation()
    const navigate: NavigateFunction = useNavigate()
    const customReturnUrl: string | undefined = useParams().retUrl
    
    useEffect(() => {
        if (props.isLoggedIn) {
            navigate(props.nextPageUrl || ROUTES.DASHBOARD_PAGE);
            setProgressItem(5);
        }
    }, [navigate, props.isLoggedIn, props.nextPageUrl]);

    function signUp(): void {
        const signUpUrl: string = routeData.getSignupUrl(
            location.pathname,
            routeData.allRoutes,
            props.nextPageUrl ?? customReturnUrl,
        )
        window.location.href = signUpUrl
    }

    function onBack(): void {
        navigate(props.previousPageUrl ?? "/self-service/work/new/website-design-legacy/page-details")
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

                    <div className={styles.btn}>
                        <Button
                            label='LOG IN'
                            url={authUrlLogin(customReturnUrl)}
                        />
                        <span className={styles.separator}>OR</span>
                        <Button
                            label='SIGN UP'
                            onClick={signUp}
                        />
                    </div>
                </div>
            </div>
            <PageDivider />
            <div className={styles.footerContent}>
                <div>
                    <Button
                        size='md'
                        icon={BackArrowIcon}
                        buttonStyle='secondary'
                        onClick={onBack}
                    />
                </div>
            </div>
        </>
    )
}

export default WorkLoginPrompt
