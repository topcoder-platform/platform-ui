import { Dispatch, FC, ReactNode, SetStateAction, useEffect, useState } from 'react'

import { routes as designLibRoutes } from '../../tools/design-lib/design-lib.routes'
import { routes as selfServiceRoutes } from '../../tools/self-service/self-service.routes'
import { routes as toolRoutes } from '../../tools/tool/tool.routes'
import { routes as homeRoutes } from '../../utils/home/home.routes'

import { PlatformRouteType } from './platform-route-type.enum'
import { PlatformRoute } from './platform-route.model'
import { RouteContextData } from './route-context-data.model'
import { default as RouteContext, defaultRouteContextData } from './route.context'

const routes: Array<PlatformRoute> = [
    ...homeRoutes,
    ...designLibRoutes,
    ...selfServiceRoutes,
    ...toolRoutes,
]

export const RouteProvider: FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }) => {

    const [routeContext, setRouteContext]: [RouteContextData, Dispatch<SetStateAction<RouteContextData>>]
        = useState<RouteContextData>(defaultRouteContextData)

    useEffect(() => {
        const getAndSetRoutes: () => Promise<void> = async () => {
            const enabledRoutes: Array<PlatformRoute> = routes.filter(route => route.enabled)
            const contextData: RouteContextData = {
                enabledRoutes,
                toolRoutes: enabledRoutes.filter(route => route.type === PlatformRouteType.tool),
                utilRoutes: enabledRoutes.filter(route => route.type === PlatformRouteType.util),
            }
            setRouteContext(contextData)
        }
        getAndSetRoutes()
    }, [])

    return (
        <RouteContext.Provider value={routeContext}>
            {children}
        </RouteContext.Provider>
    )
}
