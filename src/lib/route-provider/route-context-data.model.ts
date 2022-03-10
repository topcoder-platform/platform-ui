import { PlatformRoute } from './platform-route.model'

export interface RouteContextData {
    enabledRoutes: Array<PlatformRoute>
    toolRoutes: Array<PlatformRoute>
    utilRoutes: Array<PlatformRoute>
}
