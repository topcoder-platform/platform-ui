import { PlatformRoute } from '../lib'

import { designLibRoutes } from './design-lib/'
import { workIntakeRoutes } from './work-intake'

const toolRoutes: Array<PlatformRoute> = [
    // NOTE: these will be displayed in the order they are defined in this array
    // TODO: support ordering
    ...workIntakeRoutes,
    ...designLibRoutes,
]

export default toolRoutes
