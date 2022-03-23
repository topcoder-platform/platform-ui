import { PlatformRoute } from '../lib'

import { homeRoutes } from './home/home.routes'
<<<<<<< HEAD
import { profileRoutes } from './profile/Profile.routes'

const utilsRoutes: Array<PlatformRoute> = [
    ...homeRoutes,
    ...profileRoutes,
=======
import { settingsRoutes } from './settings'

const utilsRoutes: Array<PlatformRoute> = [
    ...homeRoutes,
    ...settingsRoutes,
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22
]

export default utilsRoutes
