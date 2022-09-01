import { PlatformRoute } from '../lib'

import { devCenterRoutes } from './dev-center'
import { gamificationAdminRoutes } from './gamification-admin'
import { learnRoutes } from './learn'
import { workRoutes } from './work'

const toolRoutes: Array<PlatformRoute> = [
    // NOTE: these will be displayed in the order they are defined in this array
    // TODO: support ordering
    ...workRoutes,
    ...devCenterRoutes,
    ...learnRoutes,
    ...gamificationAdminRoutes,
]

export default toolRoutes
