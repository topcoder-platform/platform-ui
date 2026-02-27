import { RouteNavConfig } from './route-nav-config.model'

export type PlatformRouteLayoutVariant = 'standard' | 'community'

export interface PlatformRoute {
    domain?: string
    alternativePaths?: Array<string>
    authRequired?: boolean
    children?: Array<PlatformRoute>
    disabled?: boolean
    element: JSX.Element
    id?: string
    layoutVariant?: PlatformRouteLayoutVariant
    roleErrorRoute?: string
    rolesRequired?: Array<string>
    route: string
    title?: string
    navConfig?: RouteNavConfig
}
