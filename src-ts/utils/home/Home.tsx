import { FC, useContext, useEffect } from 'react'
import { NavigateFunction, useNavigate } from 'react-router-dom'

import {
    LoadingSpinner,
    routeContext,
    RouteContextData,
} from '../../lib'

const Home: FC<{}> = () => {

    const { initialized, rootLoggedInRoute, rootLoggedOutFC }: RouteContextData = useContext<RouteContextData>(routeContext)

    const navigate: NavigateFunction = useNavigate()

    useEffect(() => {
        // if the route provider has assigned a logged in route,
        // then we must be initialized and logged in, so we can
        // safely navigate to the logged-in route.
        if (!!rootLoggedInRoute) {
            navigate(rootLoggedInRoute)
        }
    }, [
        navigate,
        rootLoggedInRoute,
    ])

    const LoggedOut: FC<{}> = rootLoggedOutFC
    const showSpinner: boolean = !initialized || !!rootLoggedInRoute

    return <>
        <LoadingSpinner show={showSpinner} />
        {!showSpinner && <LoggedOut />}
    </>
}

export default Home
