import { PlatformRoute } from '../lib'

import { designLibRoutes } from './design-lib/'
import { selfServiceRoutes } from './self-service'
import { workIntakeRoutes } from './work-intake'

const toolRoutes: Array<PlatformRoute> = [
    // NOTE: these will be displayed in the order they are defined in this array
    // TODO: support ordering
    ...designLibRoutes,
    ...selfServiceRoutes,
    ...workIntakeRoutes,
]

export default toolRoutes
