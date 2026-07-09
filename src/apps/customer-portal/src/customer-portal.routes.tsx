/**
 * App routes
 */
import { AppSubdomain, ToolTitle } from '~/config'
import {
    lazyLoad,
    LazyLoadedComponent,
    PlatformRoute,
    Rewrite,
    UserRole,
} from '~/libs/core'

import {
    rootRoute,
    talentSearchRouteId,
} from './config/routes.config'
import { customerPortalFlexiTalentRoutes } from './pages/flexi-talent/flexi-talent.routes'
import { customerPortalTalentSearchRoutes } from './pages/talent-search/talent-search.routes'
import { customerPortalProjectShowcaseRoutes } from './pages/project-showcase/project-showcase.routes'

const CustomerPortalApp: LazyLoadedComponent = lazyLoad(() => import('./CustomerPortalApp'))

export const toolTitle: string = ToolTitle.customer

export const customerPortalRoutes: ReadonlyArray<PlatformRoute> = [
    // Customer portal App Root
    {
        authRequired: true,
        children: [
            {
                authRequired: true,
                element: <Rewrite to={talentSearchRouteId} />,
                route: '',
            },
            ...customerPortalTalentSearchRoutes,
            ...customerPortalProjectShowcaseRoutes,
            ...customerPortalFlexiTalentRoutes,
        ],
        domain: AppSubdomain.customer,
        element: <CustomerPortalApp />,
        id: toolTitle,
        rolesRequired: [
            UserRole.administrator,
            UserRole.talentManager,
        ],
        route: rootRoute,
        title: toolTitle,
    },
]
