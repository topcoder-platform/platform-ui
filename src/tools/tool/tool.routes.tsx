import { PlatformRoute, PlatformRouteType } from '../../lib'

import { Tool } from '.'
import { toolTitle } from './Tool'

export const routes: Array<PlatformRoute> = [
    {
        children: [],
        element: <Tool />,
        enabled: true,
        route: 'tool',
        title: toolTitle,
        type: PlatformRouteType.tool,
    },
]
