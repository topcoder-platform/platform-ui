import { PlatformRoute } from '../../lib'

import { Home } from '.'

export const routes: Array<PlatformRoute> = [
    {
        children: [],
        element: <Home />,
        enabled: true,
        route: '/',
        title: 'Home',
    },
]
