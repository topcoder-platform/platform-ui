import { PlatformRoute } from '../../lib'

import SelfService, { toolTitle } from './SelfService'

export const selfServiceRoutes: Array<PlatformRoute> = [
    {
        children: [],
        element: <SelfService />,
        enabled: true,
        route: '/self-service',
        title: toolTitle,
    },
]
