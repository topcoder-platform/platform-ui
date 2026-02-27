import {
    lazyLoad,
    LazyLoadedComponent,
    PlatformRoute,
} from '~/libs/core'

import { thriveArticleRouteId } from '../../config/routes.config'

const ThriveArticlePage: LazyLoadedComponent = lazyLoad(() => import('./ThriveArticlePage'))

/**
 * Route definitions for the Thrive article page module.
 */
export const thriveRoutes: ReadonlyArray<PlatformRoute> = [
    {
        element: <ThriveArticlePage />,
        route: thriveArticleRouteId,
    },
]
