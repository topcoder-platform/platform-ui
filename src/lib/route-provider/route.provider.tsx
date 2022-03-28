import { Dispatch, FC, ReactElement, ReactNode, SetStateAction, useEffect, useState } from 'react'
import { Route } from 'react-router-dom'

import { PlatformRoute } from './platform-route.model'
import { RouteContextData } from './route-context-data.model'
import { default as routeContext, defaultRouteContextData } from './route.context'

interface RouteProviderProps {
    children: ReactNode
    toolsRoutes: Array<PlatformRoute>
    utilsRoutes: Array<PlatformRoute>
}

export const RouteProvider: FC<RouteProviderProps> = (props: RouteProviderProps) => {

    const [routeContextData, setRouteContextData]: [RouteContextData, Dispatch<SetStateAction<RouteContextData>>]
        = useState<RouteContextData>(defaultRouteContextData)

    useEffect(() => {

        let allRoutes: Array<PlatformRoute> = []

        const getAndSetRoutes: () => void = () => {

            // TODO: try to make these prop names configurable instead of hard-codded
            const toolsRoutes: Array<PlatformRoute> = props.toolsRoutes.filter(route => route.enabled)
            const utilsRoutes: Array<PlatformRoute> = props.utilsRoutes.filter(route => route.enabled)
            allRoutes = [
                ...toolsRoutes,
                ...utilsRoutes,
            ]
            const contextData: RouteContextData = {
                allRoutes,
                getChildRoutes,
                getChildren,
                getPath,
                toolsRoutes,
                utilsRoutes,
            }
            setRouteContextData(contextData)
        }

        function getChildren(parent: string): Array<PlatformRoute> {
            return allRoutes
                .find(route => route.title === parent)
                ?.children
                || []
        }

        function getChildRoutes(parent: string): Array<ReactElement> {
            return getChildren(parent)
                .map(route => (<Route path={route.route} element={route.element} key={route.title} />))
        }

        function getPath(routeTitle: string): string {
            return allRoutes.find(route => route.title === routeTitle)?.route as string
        }

        getAndSetRoutes()
    }, [
        props.toolsRoutes,
        props.utilsRoutes,
    ])

    return (
        <routeContext.Provider value={routeContextData}>
            {props.children}
        </routeContext.Provider>
    )
}
