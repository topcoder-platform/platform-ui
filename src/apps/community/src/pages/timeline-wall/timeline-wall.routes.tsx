import {
    lazyLoad,
    LazyLoadedComponent,
    PlatformRoute,
} from '~/libs/core'

import { timelineWallRouteId } from '../../config/routes.config'

const TimelineWallPage: LazyLoadedComponent = lazyLoad(
    () => import('./TimelineWallPage'),
)

/**
 * Route definitions for the timeline wall page module.
 */
export const timelineWallRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: false,
        element: <TimelineWallPage />,
        route: timelineWallRouteId,
    },
]
