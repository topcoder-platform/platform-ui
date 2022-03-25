import { PlatformRoute } from '../../lib'

import MyWork, { toolTitle } from './Work'

export const myWorkRoutes: Array<PlatformRoute> = [
    {
        children: [],
        element: <MyWork />,
        enabled: true,
        route: '/self-service',
        title: toolTitle,
    },
]
