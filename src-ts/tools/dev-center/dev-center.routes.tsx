import { PlatformRoute } from '../../lib'

import DevCenter, { toolTitle } from './DevCenter'

export const devCenterRoutes: Array<PlatformRoute> = [
    {
        children: [],
        element: <DevCenter />,
        enabled: true,
        route: '/dev-center',
        title: toolTitle,
    },
]
