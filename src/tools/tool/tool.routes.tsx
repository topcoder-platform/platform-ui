import { PlatformRoute } from '../../lib'

import Tool, { toolTitle } from './Tool'

export const toolRoutes: Array<PlatformRoute> = [
    {
        children: [],
        element: <Tool />,
        enabled: true,
        route: '/tool',
        title: toolTitle,
    },
]
