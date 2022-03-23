import { PlatformRoute } from '../lib'

import { homeRoutes } from './home/home.routes'
import { settingsRoutes } from './settings'

const utilsRoutes: Array<PlatformRoute> = [
    ...homeRoutes,
    ...settingsRoutes,
]

export default utilsRoutes
