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
    billingAccountsPageRouteId,
    bulkMemberLookupRouteId,
    reportsPageRouteId,
    rootRoute,
    talentPageRouteId,
} from './config/routes.config'

const ReportsApp: LazyLoadedComponent = lazyLoad(() => import('./ReportsApp'))
const ReportsPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/reports/ReportsPage'),
    'ReportsPage',
)
const BillingAccountsPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/reports/BillingAccountsPage'),
)
const BulkMemberLookupPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/bulk-member-lookup/BulkMemberLookupPage'),
    'BulkMemberLookupPage',
)
const TalentPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/talent'),
    'TalentPage',
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
                element: <BillingAccountsPage />,
                route: billingAccountsPageRouteId,
            },
            {
                authRequired: true,
                element: <BulkMemberLookupPage />,
                route: bulkMemberLookupRouteId,
            },
            {
                authRequired: true,
                element: <TalentPage />,
                route: talentPageRouteId,
            },
        ],
        domain: AppSubdomain.reports,
        element: <ReportsApp />,
        id: toolTitle,
        rolesRequired: [
            UserRole.administrator,
            UserRole.talentManager,
        ],
        route: rootRoute,
        title: toolTitle,
    },
]
