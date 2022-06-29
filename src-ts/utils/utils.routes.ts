import { PlatformRoute } from '../lib'

import { contactSupportRoutes } from './contact-support'
import { settingsRoutes } from './settings'

const utilsRoutes: Array<PlatformRoute> = [
    ...contactSupportRoutes,
    ...settingsRoutes,
]

export default utilsRoutes
