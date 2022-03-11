import { PlatformRoute } from '../lib'

import { homeRoutes } from './home/home.routes'

const utilsRoutes: Array<PlatformRoute> = [
    ...homeRoutes,
]

export default utilsRoutes
