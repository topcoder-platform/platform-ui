import { PlatformRoute } from '../platform-route.model'

export function isActiveTool(activePath: string, toolRoute: PlatformRoute): boolean {
    return !!activePath.startsWith(toolRoute.route)
        || !!toolRoute.alternativePaths?.some(path => activePath.startsWith(path))
}
