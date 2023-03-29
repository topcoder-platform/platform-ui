import { PlatformRoute } from '../lib'

import { devCenterRoutes } from './dev-center'
import { gamificationAdminRoutes } from './gamification-admin'
import { learnRoutes } from './learn'
import { workRoutes } from './work'
import { gigsRoutes } from './gigs'

const toolRoutes: ReadonlyArray<PlatformRoute> = [
    // NOTE: Order matters here bc the active tool
    // is determined by finding the first route
    // that matches the current path
    ...workRoutes,
    ...devCenterRoutes,
    ...learnRoutes,
    ...gamificationAdminRoutes,
    ...gigsRoutes,
]

export default toolRoutes
