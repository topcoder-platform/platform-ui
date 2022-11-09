import { FC, useCallback, useContext } from 'react'
import { Location, useLocation } from 'react-router-dom'

import {
    authUrlLogin,
    Button,
    routeContext,
    RouteContextData,
} from '../../../../../lib'
import '../../../../../lib/styles/index.scss'

const ProfileNotLoggedIn: FC<{}> = () => {

    const routeData: RouteContextData = useContext(routeContext)
    const location: Location = useLocation()

    const signUpHandler: () => void = useCallback(() => {
        const signupUrl: string = routeData.getSignupUrl(location.pathname, routeData.toolsRoutes)
        window.location.href = signupUrl
    }, [
        location.pathname,
        routeData,
    ])

    return (
        <>
            <Button
                buttonStyle='text'
                className='mobile-hide'
                label='Log In'
                size='md'
                tabIndex={-1}
                url={authUrlLogin()}
            />
            <Button
                buttonStyle='tertiary'
                label='Sign Up'
                size='md'
                tabIndex={-1}
                onClick={signUpHandler}
            />
        </>
    )
}

export default ProfileNotLoggedIn
