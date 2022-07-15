import { Context, createContext } from 'react'

import { RouteContextData } from './route-context-data.model'

export const defaultRouteContextData: RouteContextData = {
    allRoutes: [],
    getChildRoutes: () => [],
    getChildren: () => [],
    getPath: () => '',
    getPathFromRoute: () => '',
    getRouteElement: () => <></>,
    initialized: false,
    isActiveTool: () => false,
    isRootRoute: () => false,
    rootLoggedInRoute: '',
    rootLoggedOutFC: () => <></>,
    toolsRoutes: [],
    toolsRoutesForNav: [],
    utilsRoutes: [],
}

const routeContext: Context<RouteContextData> = createContext(defaultRouteContextData)

export default routeContext
