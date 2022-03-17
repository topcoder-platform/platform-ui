import { PlatformRoute } from '../lib'

import { designLibRoutes } from './design-lib/design-lib.routes'
import { selfServiceRoutes } from './self-service/self-service.routes'
import { workIntakeRoutes as workIntakeRoutes } from './work-intake/work-intake.routes'

const toolRoutes: Array<PlatformRoute> = [
    // NOTE: these will be displayed in the order they are defined in this array
    // TODO: support ordering
    ...designLibRoutes,
    ...selfServiceRoutes,
    ...workIntakeRoutes,
]

export default toolRoutes
