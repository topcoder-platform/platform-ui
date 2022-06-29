import { ReactElement } from 'react'

import { PlatformRoute } from './platform-route.model'

export interface RouteContextData {
    allRoutes: Array<PlatformRoute>
    getChildren: (parent: string) => Array<PlatformRoute>
    getChildRoutes: (parent: string) => Array<ReactElement>
    getPath: (routeTitle: string) => string
    getPathFromRoute: (route: PlatformRoute) => string
    getRouteElement: (route: PlatformRoute) => JSX.Element
    isActiveRoute: (activePath: string, pathName: string, rootPath?: string) => boolean
    isRootRoute: (activePath: string) => boolean
    rootLoggedInRoute: string
    rootLoggedOutRoute: string
    toolsRoutes: Array<PlatformRoute>
    toolsRoutesForNav: Array<PlatformRoute>
    utilsRoutes: Array<PlatformRoute>
}
