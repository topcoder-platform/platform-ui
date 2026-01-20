/**
 * App routes
 */
import { AppSubdomain, ToolTitle } from '~/config'
import {
    lazyLoad,
    LazyLoadedComponent,
    PlatformRoute,
    Rewrite,
} from '~/libs/core'

import {
    rootRoute,
    talentSearchRouteId,
} from './config/routes.config'
import { customerPortalTalentSearchRoutes } from './pages/talent-search/talent-search.routes'

const CustomerPortalApp: LazyLoadedComponent = lazyLoad(() => import('./CustomerPortalApp'))

export const toolTitle: string = ToolTitle.customer

export const customerPortalRoutes: ReadonlyArray<PlatformRoute> = [
    // Customer portal App Root
    {
        children: [
            {
                authRequired: true,
                element: <Rewrite to={talentSearchRouteId} />,
                route: '',
            },
            ...customerPortalTalentSearchRoutes,
        ],
        domain: AppSubdomain.customer,
        element: <CustomerPortalApp />,
        id: toolTitle,
        route: rootRoute,
        title: toolTitle,
    },
]
