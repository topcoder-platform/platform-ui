import { PlatformRoute, PlatformRouteType } from '../../lib'

import { Home } from '.'
import { utilTitle } from './Home'

export const routes: Array<PlatformRoute> = [
    {
        children: [],
        element: <Home />,
        enabled: true,
        route: '/',
        title: utilTitle,
        type: PlatformRouteType.util,
    },
]
