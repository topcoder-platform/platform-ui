import { PlatformRoute } from '../../lib'

import Work, { toolTitle } from './Work'

export const myWorkRoutes: Array<PlatformRoute> = [
    {
        children: [],
        element: <Work />,
        enabled: true,
        route: '/work',
        title: toolTitle,
    },
]
