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
    bulkMemberLookupRouteId,
    reportsPageRouteId,
    rootRoute,
} from './config/routes.config'

const ReportsApp: LazyLoadedComponent = lazyLoad(() => import('./ReportsApp'))
const ReportsPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/reports/ReportsPage'),
    'ReportsPage',
)
const BulkMemberLookupPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/bulk-member-lookup/BulkMemberLookupPage'),
    'BulkMemberLookupPage',
)

export const toolTitle: string = ToolTitle.reports

export const reportsRoutes: ReadonlyArray<PlatformRoute> = [
    // Reports App Root
    {
        authRequired: true,
        children: [
            {
                authRequired: true,
                element: <Rewrite to={reportsPageRouteId} />,
                route: '',
            },
            {
                authRequired: true,
                element: <ReportsPage />,
                route: reportsPageRouteId,
            },
            {
                authRequired: true,
                element: <BulkMemberLookupPage />,
                route: bulkMemberLookupRouteId,
            },
        ],
        domain: AppSubdomain.reports,
        element: <ReportsApp />,
        id: toolTitle,
        rolesRequired: [
            UserRole.administrator,
            UserRole.projectManager,
            UserRole.talentManager,
        ],
        route: rootRoute,
        title: toolTitle,
    },
]
