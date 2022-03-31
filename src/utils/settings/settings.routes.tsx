import { SETTINGS_TITLE } from '../../config'
import { PlatformRoute } from '../../lib'

import Settings from './Settings'

export const settingsRoutes: Array<PlatformRoute> = [
    {
        children: [],
        element: <Settings />,
        enabled: true,
        route: '/settings',
        title: SETTINGS_TITLE,
    },
]
