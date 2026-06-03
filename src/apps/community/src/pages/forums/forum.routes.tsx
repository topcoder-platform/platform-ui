import { PlatformRoute } from '~/libs/core'

import {
    forumCreateTopicRouteId,
    forumListingRouteId,
    forumTopicRouteId,
} from '../../config/routes.config'

import ForumsPage, { ForumsPageMode } from './ForumsPage'

/**
 * Route definitions for the sample forum screens.
 */
export const forumRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: false,
        element: <ForumsPage mode={ForumsPageMode.list} />,
        route: forumListingRouteId,
    },
    {
        authRequired: false,
        element: <ForumsPage mode={ForumsPageMode.create} />,
        route: forumCreateTopicRouteId,
    },
    {
        authRequired: false,
        element: <ForumsPage mode={ForumsPageMode.detail} />,
        route: forumTopicRouteId,
    },
]
