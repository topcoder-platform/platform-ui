import { FC, useContext, useEffect } from 'react'
import { NavigateFunction, useNavigate } from 'react-router-dom'

import { routeContext, RouteContextData } from '../../lib'
import '../../lib/styles/index.scss'

const Home: FC<{}> = () => {

    const {
        initialized,
        rootLoggedInRoute,
        rootLoggedOutFC,
    }: RouteContextData = useContext<RouteContextData>(routeContext)

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
    const showLoggedOut: boolean = initialized && !rootLoggedInRoute

    return (
        <div className='full-height-frame'>
            {showLoggedOut && <LoggedOut />}
        </div>
    )
}

export default Home
