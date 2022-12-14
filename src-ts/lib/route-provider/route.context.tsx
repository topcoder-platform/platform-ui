import { Context, createContext } from 'react'

import { RouteContextData } from './route-context-data.model'

export const defaultRouteContextData: RouteContextData = {
    allRoutes: [],
    getChildren: () => [],
    getChildRoutes: () => [],
    getPathFromRoute: () => '',
    getRouteElement: () => <></>,
    getSignupUrl: () => '',
    initialized: false,
    isRootRoute: () => false,
    rootLoggedInRoute: '',
    rootLoggedOutFC: () => <></>,
    toolsRoutes: [],
    utilsRoutes: [],
}

const routeContext: Context<RouteContextData> = createContext(defaultRouteContextData)

export default routeContext
