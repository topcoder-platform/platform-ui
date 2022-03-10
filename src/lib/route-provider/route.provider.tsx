import { Dispatch, FC, ReactNode, SetStateAction, useEffect, useState } from 'react'

import { ToolsRoutes } from '../../tools'
import { UtilsRoutes } from '../../utils'

import { RouteContextData } from './route-context-data.model'
import { default as RouteContext, defaultRouteContextData } from './route.context'

export const RouteProvider: FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }) => {

    const [routeContext, setRouteContext]: [RouteContextData, Dispatch<SetStateAction<RouteContextData>>]
        = useState<RouteContextData>(defaultRouteContextData)

    useEffect(() => {
        const getAndSetRoutes: () => Promise<void> = async () => {

            const contextData: RouteContextData = {
                toolsRoutes: ToolsRoutes.filter(route => route.enabled),
                utilsRoutes: UtilsRoutes.filter(route => route.enabled),
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
