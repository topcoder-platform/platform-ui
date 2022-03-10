import { PlatformRoute } from '../lib'

import { designLibRoutes } from './design-lib/design-lib.routes'
import { selfServiceRoutes } from './self-service/self-service.routes'
import { toolRoutes as toolToolRoutes } from './tool/tool.routes'

const toolRoutes: Array<PlatformRoute> = [
    // NOTE: these will be displayed in the order they are defined in this array
    // TODO: support ordering
    ...designLibRoutes,
    ...selfServiceRoutes,
    ...toolToolRoutes,
]

export default toolRoutes
