import { Dispatch, FC, ReactNode, SetStateAction, useEffect, useState } from 'react'

import { RouteConfig } from '../../config'
import { DesignLib, SelfService, Tool } from '../../tools'
import { Home } from '../../utils'

import { PlatformRoute } from './platform-route.model'
import { RouteContextData } from './route-context-data.model'
import { default as RouteContext, defaultRouteContextData } from './route.context'

const routes: Array<PlatformRoute> = [
    {
        element: <Home />,
        route: RouteConfig.home,
        title: 'Home',
    },
    {
        element: <DesignLib />,
        route: RouteConfig.designLib,
        title: 'Design Library',
    },
    {
        element: <SelfService />,
        route: RouteConfig.selfService,
        title: 'Self Service',
    },
    {
        element: <Tool />,
        route: RouteConfig.tool,
        title: 'Tool',
    },
]

export const RouteProvider: FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }) => {

    const [routeContext, setRouteContext]: [RouteContextData, Dispatch<SetStateAction<RouteContextData>>]
        = useState<RouteContextData>(defaultRouteContextData)

    useEffect(() => {

        const getAndSetRoute: () => Promise<void> = async () => {
            const contextData: RouteContextData = {
                routes,
            }
            setRouteContext(contextData)
        }

        getAndSetRoute()
    }, [])

    return (
        <RouteContext.Provider value={routeContext}>
            {children}
        </RouteContext.Provider>
    )
}
