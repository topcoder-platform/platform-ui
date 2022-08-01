import { ToolTitle } from '../../../config'
import { AuthenticationRegistrationSource, authUrlSignup } from '../../functions'
import { PlatformRoute } from '../platform-route.model'

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
