import { ToolTitle } from '../../config'
import { AuthenticationRegistrationSource, authUrlSignup } from '../functions'
import { PlatformRoute, routeIsActiveTool } from '../route-provider'

export function useSignUp(currentLocation: string, toolRoutes: Array<PlatformRoute>, returnUrl?: string): void {

    // figure out the current tool so we can assign the correct reg source
    const activeTool: PlatformRoute | undefined = toolRoutes.find(tool => routeIsActiveTool(currentLocation, tool))

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

    window.location.href = authUrlSignup(returnUrl, regSource)
}
