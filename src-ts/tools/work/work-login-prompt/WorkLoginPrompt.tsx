import { FC, useContext } from 'react'
import { Location, NavigateFunction, useLocation, useNavigate, useParams } from 'react-router-dom'

import {
    authUrlLogin,
    Button,
    PageDivider,
    routeContext,
    RouteContextData,
} from '../../../lib'

import { BackArrowIcon } from "../../../lib/svgs";

import styles from './WorkLoginPrompt.module.scss'

interface WorkLoginPromptProps {
  previousPageUrl: string
}

const WorkLoginPrompt: FC<WorkLoginPromptProps> = ({ previousPageUrl }: WorkLoginPromptProps)  => {

    const routeData: RouteContextData = useContext(routeContext)
    const location: Location = useLocation()
    const navigate: NavigateFunction = useNavigate()
    const customReturnUrl: string | undefined = useParams().retUrl

    function signUp(): void {
        const signUpUrl: string = routeData.getSignupUrl(location.pathname, routeData.toolsRoutes, customReturnUrl)
        window.location.href = signUpUrl
    }

    const onBack = () => {
      navigate(
        previousPageUrl
      );
    };

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
                            onClick={signUp}
                        />
                    </div>
                </div>
            </div>
            <PageDivider />
            <div className={styles["footerContent"]}>
              <div>
                <Button
                  size="md"
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
