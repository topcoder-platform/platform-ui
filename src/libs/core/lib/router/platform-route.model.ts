import { RouteNavConfig } from './route-nav-config.model'

export interface PlatformRoute {
    domain?: string
    alternativePaths?: Array<string>
    authRequired?: boolean
    children?: Array<PlatformRoute>
    disabled?: boolean
    element: JSX.Element
    id?: string
    rolesRequired?: Array<string>
    route: string
    title?: string
    navConfig?: RouteNavConfig
}
