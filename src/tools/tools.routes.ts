import { PlatformRoute } from '../lib'

import { designLibRoutes } from './design-lib/'
import { workRoutes } from './work'
import { workIntakeRoutes } from './work-intake'

const toolRoutes: Array<PlatformRoute> = [
    // NOTE: these will be displayed in the order they are defined in this array
    // TODO: support ordering
    ...designLibRoutes,
    ...workRoutes,
    ...workIntakeRoutes,
]

export default toolRoutes
