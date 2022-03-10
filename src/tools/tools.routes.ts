import { PlatformRoute } from '../lib'

import { designLibRoutes } from './design-lib/design-lib.routes'
import { selfServiceRoutes } from './self-service/self-service.routes'
import { toolRoutes as toolToolRoutes } from './tool/tool.routes'

const toolRoutes: Array<PlatformRoute> = [
    ...designLibRoutes,
    ...selfServiceRoutes,
    ...toolToolRoutes,
]

export default toolRoutes
