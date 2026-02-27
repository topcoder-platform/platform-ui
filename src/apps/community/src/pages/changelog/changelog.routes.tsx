import {
    lazyLoad,
    LazyLoadedComponent,
    PlatformRoute,
} from '~/libs/core'

import { changelogRouteId } from '../../config/routes.config'

const ChangelogPage: LazyLoadedComponent = lazyLoad(
    () => import('./ChangelogPage'),
)

/**
 * Route definitions for the changelog page module.
 */
export const changelogRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: false,
        element: <ChangelogPage />,
        route: changelogRouteId,
    },
]
