import { PlatformRoute } from '../../lib'

import Home, { utilTitle } from './Home'

export const homeRoutes: Array<PlatformRoute> = [
    {
        children: [],
        element: <Home />,
        enabled: true,
        route: '/',
        title: utilTitle,
    },
]
