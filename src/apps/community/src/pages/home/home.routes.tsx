import {
    lazyLoad,
    LazyLoadedComponent,
    PlatformRoute,
} from '~/libs/core'

import { homeRouteId } from '../../config/routes.config'

const HomePage: LazyLoadedComponent = lazyLoad(() => import('./HomePage'))

/**
 * Route definitions for the home page module.
 */
export const homeRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: true,
        element: <HomePage />,
        route: '',
    },
    {
        authRequired: true,
        element: <HomePage />,
        route: homeRouteId,
    },
]
