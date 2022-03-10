import { PlatformRoute, PlatformRouteType } from '../../lib'

import { SelfService } from './'
import { toolTitle } from './SelfService'

export const routes: Array<PlatformRoute> = [
    {
        children: [],
        element: <SelfService />,
        enabled: true,
        route: 'self-service',
        title: toolTitle,
        type: PlatformRouteType.tool,
    },
]
