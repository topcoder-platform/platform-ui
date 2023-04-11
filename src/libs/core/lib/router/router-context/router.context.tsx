import { Context, createContext, ReactElement } from 'react'

import { PlatformRoute } from '../platform-route.model'

export interface RouterContextData {
    activeToolName?: string
    activeToolRoute?: string
    allRoutes: Array<PlatformRoute>
    getChildren: (parent: string) => Array<PlatformRoute>
    getChildRoutes: (parent: string) => Array<ReactElement>
    getPathFromRoute: (route: PlatformRoute) => string
    getRouteElement: (route: PlatformRoute) => JSX.Element
    getSignupUrl: (currentLocation: string, toolRoutes: Array<PlatformRoute>, returnUrl?: string) => string
    initialized: boolean
    isRootRoute: (activePath: string) => boolean
    rootLoggedInRoute: string
    rootLoggedOutRoute: string
}

export const routerContextDefaultData: RouterContextData = {
    allRoutes: [],
    getChildren: () => [],
    getChildRoutes: () => [],
    getPathFromRoute: () => '',
    getRouteElement: () => <></>,
    getSignupUrl: () => '',
    initialized: false,
    isRootRoute: () => false,
    rootLoggedInRoute: '',
    rootLoggedOutRoute: '',
}

export const routerContext: Context<RouterContextData> = createContext(routerContextDefaultData)
