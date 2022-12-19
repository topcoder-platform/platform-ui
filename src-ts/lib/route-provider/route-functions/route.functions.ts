import {
    AuthenticationRegistrationSource,
    authGetRegistrationSource,
    authUrlSignup,
} from '../../functions'
import { PlatformRoute } from '../platform-route.model'

export function getActive(currentLocation: string, toolRoutes: Array<PlatformRoute>): PlatformRoute | undefined {
    return toolRoutes.find(tool => isActiveTool(currentLocation, tool))
}

// NOTE: this function ties together routes and auth,
// so one could make an argument that it should be
// part of the auth functions and be provided by the
// profile provider; however, the routes are already
// dependent on the profile context, so I didn't want to
// make the profile context also dependent on the routes.
export function getSignupUrl(
    currentLocation: string,
    toolRoutes: Array<PlatformRoute>,
    returnUrl?: string,
): string {

    // figure out the current tool so we can assign the correct reg source
    const activeTool: PlatformRoute | undefined = getActive(currentLocation, toolRoutes)
    const regSource: AuthenticationRegistrationSource | undefined
        = authGetRegistrationSource(activeTool)

    return authUrlSignup(returnUrl, regSource)
}

function isActiveTool(activePath: string, toolRoute: PlatformRoute): boolean {
    return !!activePath.startsWith(toolRoute.route)
        || !!toolRoute.alternativePaths?.some(path => activePath.startsWith(path))
}
