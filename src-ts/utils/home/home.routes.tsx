import { PlatformRoute } from '../../lib'

import { default as Home } from './Home'

export const homeRoutes: Array<PlatformRoute> = [
    {
        element: <Home />,
        hide: true,
        route: '',
        title: 'Home page',
    },
]
