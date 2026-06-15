/**
 * App routes
 */
import { AppSubdomain, ToolTitle } from '~/config'
import {
    lazyLoad,
    LazyLoadedComponent,
    PlatformRoute,
    UserRole,
} from '~/libs/core'

import {
    rootRoute,
} from './config/routes.config'

const CustomerPortalApp: LazyLoadedComponent = lazyLoad(() => import('./CustomerPortalApp'))

export const toolTitle: string = ToolTitle.customer

export const customerPortalRoutes: ReadonlyArray<PlatformRoute> = [
    // Customer portal App Root
    {
        authRequired: true,
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
