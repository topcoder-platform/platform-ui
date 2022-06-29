import { Context, createContext } from 'react'

import { RouteContextData } from './route-context-data.model'

export const defaultRouteContextData: RouteContextData = {
    allRoutes: [],
    getChildRoutes: () => [],
    getChildren: () => [],
    getPath: () => '',
    getPathFromRoute: () => '',
    getRouteElement: () => <></>,
    isActiveRoute: () => false,
    isRootRoute: () => false,
    rootLoggedInRoute: '',
    rootLoggedOutRoute: '',
    toolsRoutes: [],
    toolsRoutesForNav: [],
    utilsRoutes: [],
}

const routeContext: Context<RouteContextData> = createContext(defaultRouteContextData)

export default routeContext
