import { FC, useContext, useEffect } from 'react'
import { Location, NavigateFunction, useLocation, useNavigate, useParams } from 'react-router-dom'

import {
    BackArrowIcon,
    Button,
    LinkButton,
    PageDivider,
} from '~/libs/ui'
import { authUrlLogin, routerContext, RouterContextData } from '~/libs/core'

import { ROUTES, selfServiceRootRoute } from '../../config'
import { setProgressItem } from '../../actions/progress'

import styles from './WorkLoginPrompt.module.scss'

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
            navigate(props.nextPageUrl || ROUTES.DASHBOARD_PAGE)
            setProgressItem(5)
        }
    }, [navigate, props.isLoggedIn, props.nextPageUrl])

    function signUp(): void {
        const signUpUrl: string = routeData.getSignupUrl(
            location.pathname,
            routeData.allRoutes,
            props.nextPageUrl ?? customReturnUrl,
        )
        window.location.href = signUpUrl
    }

    function onBack(): void {
        navigate(props.previousPageUrl ?? `${selfServiceRootRoute}/new/website-design-legacy/page-details`)
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
                        <LinkButton
                            primary
                            size='lg'
                            label='LOG IN'
                            to={authUrlLogin(customReturnUrl)}
                        />
                        <span className={styles.separator}>OR</span>
                        <Button
                            primary
                            size='lg'
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
                        secondary
                        size='lg'
                        icon={BackArrowIcon}
                        onClick={onBack}
                    />
                </div>
            </div>
        </>
    )
}

export default WorkLoginPrompt
