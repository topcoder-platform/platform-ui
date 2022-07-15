import { PlatformRoute } from '../../lib'

import { default as Home } from './Home'

export const homeRoute: string = ''

export const homeRoutes: Array<PlatformRoute> = [
    {
        element: <Home />,
        hide: true,
        route: homeRoute,
        title: 'Home page',
    },
]
