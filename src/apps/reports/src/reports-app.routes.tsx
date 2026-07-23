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
    dashboardDetailRoute,
    dashboardsPageRouteId,
    reportsPageRouteId,
    rootRoute,
    talentPageRouteId,
} from './config/routes.config'

const ReportsApp: LazyLoadedComponent = lazyLoad(() => import('./ReportsApp'))
const ReportsPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/reports/ReportsPage'),
    'ReportsPage',
)
const DashboardsPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/dashboards/DashboardsPage'),
    'DashboardsPage',
)
const DashboardDetailPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/dashboards/DashboardDetailPage'),
    'DashboardDetailPage',
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
                element: <DashboardsPage />,
                route: dashboardsPageRouteId,
            },
            {
                authRequired: true,
                element: <DashboardDetailPage />,
                route: dashboardDetailRoute,
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
