import {
    lazyLoad,
    LazyLoadedComponent,
    PlatformRoute,
} from '~/libs/core'

import {
    thriveArticleRouteId,
    thriveListingRouteId,
    thriveSearchRouteId,
    thriveTracksRouteId,
} from '../../config/routes.config'

const ThriveListingPage: LazyLoadedComponent = lazyLoad(() => import('./ThriveListingPage'))
const ThriveArticlePage: LazyLoadedComponent = lazyLoad(() => import('./ThriveArticlePage'))

/**
 * Route definitions for the Thrive article page module.
 */
export const thriveRoutes: ReadonlyArray<PlatformRoute> = [
    {
        element: <ThriveListingPage />,
        route: thriveListingRouteId,
    },
    {
        element: <ThriveListingPage />,
        route: thriveTracksRouteId,
    },
    {
        element: <ThriveListingPage />,
        route: thriveSearchRouteId,
    },
    {
        element: <ThriveArticlePage />,
        route: thriveArticleRouteId,
    },
]
