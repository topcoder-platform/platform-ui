import { PlatformRoute } from '../lib'

import { contactSupportRoutes } from './contact-support'
import { homeRoutes } from './home'
import { settingsRoutes } from './settings'

const utilsRoutes: ReadonlyArray<PlatformRoute> = [
    // NOTE: Order matters here bc the active tool
    // is determined by finding the first route
    // that matches the current path
    ...contactSupportRoutes,
    ...settingsRoutes,
    // home routes need to be last bc they match all other routes
    ...homeRoutes,
]

export default utilsRoutes
