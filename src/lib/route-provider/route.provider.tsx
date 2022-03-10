import { Dispatch, FC, ReactNode, SetStateAction, useEffect, useState } from 'react'

import { RouteConfig } from '../../config'
import { SelfService, Tool } from '../../tools'
import { routes as designLibRoutes } from '../../tools/design-lib/design-lib.routes'
import { Home } from '../../utils'

import { PlatformRoute } from './platform-route.model'
import { RouteContextData } from './route-context-data.model'
import { default as RouteContext, defaultRouteContextData } from './route.context'

const routes: Array<PlatformRoute> = [
    {
        children: [],
        element: <Home />,
        enabled: true,
        route: RouteConfig.home,
        title: 'Home',
    },
    ...designLibRoutes,
    {
        children: [],
        element: <SelfService />,
        enabled: true,
        route: RouteConfig.selfService,
        title: 'Self Service',
    },
    {
        children: [],
        element: <Tool />,
        enabled: true,
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
