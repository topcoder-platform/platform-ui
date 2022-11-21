import { FC, ReactElement } from 'react'

import { PlatformRoute } from './platform-route.model'

export interface RouteContextData {
    activeToolName?: string
    allRoutes: Array<PlatformRoute>
    getChildren: (parent: string) => Array<PlatformRoute>
    getChildRoutes: (parent: string) => Array<ReactElement>
    getPath: (routeTitle: string) => string
    getPathFromRoute: (route: PlatformRoute) => string
    getRouteElement: (route: PlatformRoute) => JSX.Element
    getSignupUrl: (currentLocation: string, toolRoutes: Array<PlatformRoute>, returnUrl?: string) => string
    initialized: boolean
    isRootRoute: (activePath: string) => boolean
    rootLoggedInRoute: string
    rootLoggedOutFC: FC<{}>
    toolsRoutes: Array<PlatformRoute>
    toolsRoutesForNav: Array<PlatformRoute>
    utilsRoutes: Array<PlatformRoute>
}
