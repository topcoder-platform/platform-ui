import { PlatformRoute } from '../../lib'

import Settings, { settingsTitle } from './Settings'

export const settingsRoutes: Array<PlatformRoute> = [
    {
        children: [],
        element: <Settings />,
        enabled: true,
        route: '/settings',
        title: settingsTitle,
    },
]
