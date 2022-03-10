import { Dispatch, FC, ReactNode, SetStateAction, useEffect, useState } from 'react'

import { RouteContextData } from './route-context-data.model'
import { default as RouteContext, defaultRouteContextData } from './route.context'

interface RouteProviderProps extends RouteContextData {
    children: ReactNode,
}

export const RouteProvider: FC<RouteProviderProps> = (props: RouteProviderProps) => {

    const [routeContext, setRouteContext]: [RouteContextData, Dispatch<SetStateAction<RouteContextData>>]
        = useState<RouteContextData>(defaultRouteContextData)

    useEffect(() => {
        const getAndSetRoutes: () => Promise<void> = async () => {
            const contextData: RouteContextData = {
                toolsRoutes: props.toolsRoutes.filter(route => route.enabled),
                utilsRoutes: props.utilsRoutes.filter(route => route.enabled),
            }
            setRouteContext(contextData)
        }
        getAndSetRoutes()
    }, [
        props.toolsRoutes,
        props.utilsRoutes,
    ])

    return (
        <RouteContext.Provider value={routeContext}>
            {props.children}
        </RouteContext.Provider>
    )
}
