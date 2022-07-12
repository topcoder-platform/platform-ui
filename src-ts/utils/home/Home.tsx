import { FC, useContext, useEffect } from 'react'
import { NavigateFunction, useNavigate } from 'react-router-dom'

import { profileContext, ProfileContextData, routeContext, RouteContextData } from '../../lib'
// WARNING: this has to be imported from its specific directory bc it
// causes circular or missing references when added to the barrel files
import { WorkNotLoggedIn } from '../../tools/work/work-not-logged-in'

const Home: FC<{}> = () => {

    const { initialized, isLoggedIn }: ProfileContextData = useContext<ProfileContextData>(profileContext)
    const { rootLoggedInRoute, rootLoggedOutRoute }: RouteContextData = useContext<RouteContextData>(routeContext)

    const navigate: NavigateFunction = useNavigate()

    useEffect(() => {
        if (isLoggedIn) {
            navigate(isLoggedIn ? rootLoggedInRoute : rootLoggedOutRoute)
        }
    }, [navigate, initialized, isLoggedIn, rootLoggedInRoute])

    return <WorkNotLoggedIn />
}

export default Home
