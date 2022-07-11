import { PlatformRoute } from '../lib'

import { contactSupportRoutes } from './contact-support'
import { homeRoutes } from './home'
import { settingsRoutes } from './settings'

const utilsRoutes: Array<PlatformRoute> = [
    ...contactSupportRoutes,
    ...homeRoutes,
    ...settingsRoutes,
]

export default utilsRoutes
