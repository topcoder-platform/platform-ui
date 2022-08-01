import { ToolTitle } from '../../../config'
import { AuthenticationRegistrationSource, authUrlSignup } from '../../functions'
import { PlatformRoute } from '../platform-route.model'

// NOTE: this function ties together routes and auth,
// so one could make an argument that it should be
// part of the auth functions and be provided by the
// profile provider; however, the routes are already
// dependent on the profile context, so I didn't want to
// make the profile context also dependent on the routes.
export function getSignupUrl(currentLocation: string, toolRoutes: Array<PlatformRoute>, returnUrl?: string): string {

    // figure out the current tool so we can assign the correct reg source
    const activeTool: PlatformRoute | undefined = toolRoutes.find(tool => isActiveTool(currentLocation, tool))

    let regSource: AuthenticationRegistrationSource | undefined

    switch (activeTool?.title) {

        // currently, there is no reg source for members
        case ToolTitle.learn:
            break

        // currently, the work tool and the platform
        // landing page use the reg source of selfService
        default:
            regSource = AuthenticationRegistrationSource.work
    }

    return authUrlSignup(returnUrl, regSource)
}

export function isActiveTool(activePath: string, toolRoute: PlatformRoute): boolean {
    return !!activePath.startsWith(toolRoute.route)
        || !!toolRoute.alternativePaths?.some(path => activePath.startsWith(path))
}
