import { FC, useContext, useEffect } from 'react'
import { Navigate, NavigateFunction, useNavigate } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'
import { LoadingSpinner } from '~/libs/ui'
import '~/libs/ui/lib/styles/index.scss'

const HomePage: FC<{}> = () => {

    const {
        initialized,
        rootLoggedInRoute,
        rootLoggedOutRoute,
    }: RouterContextData = useContext<RouterContextData>(routerContext)

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
        rootLoggedOutRoute,
    ])

    const showLoggedOut: boolean = initialized && !rootLoggedInRoute

    return (
        <div className='full-height-frame'>
            <LoadingSpinner hide={initialized} />

            {showLoggedOut && (
                <Navigate to={rootLoggedOutRoute} />
            )}
        </div>
    )
}

export default HomePage
