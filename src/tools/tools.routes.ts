import { PlatformRoute } from '../lib'

import { designLibRoutes } from './design-lib/design-lib.routes'
import { myWorkRoutes } from './work/work.routes'
import { toolRoutes as toolToolRoutes } from './tool/tool.routes'

const toolRoutes: Array<PlatformRoute> = [
    // NOTE: these will be displayed in the order they are defined in this array
    // TODO: support ordering
    ...designLibRoutes,
    ...myWorkRoutes,
    ...toolToolRoutes,
]

export default toolRoutes
