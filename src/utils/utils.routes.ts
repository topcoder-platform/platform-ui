import { PlatformRoute } from '../lib'

import { homeRoutes } from './home/home.routes'
import { profileRoutes } from './profile/Profile.routes'

const utilsRoutes: Array<PlatformRoute> = [
    ...homeRoutes,
    ...profileRoutes,
]

export default utilsRoutes
