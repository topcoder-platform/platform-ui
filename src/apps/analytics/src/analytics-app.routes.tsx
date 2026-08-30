/** Platform route tree for the role-gated Analytics application. */
import { AppSubdomain, ToolTitle } from '~/config'
import {
    lazyLoad,
    LazyLoadedComponent,
    PlatformRoute,
    Rewrite,
    UserRole,
} from '~/libs/core'

import {
    campaignsRouteId,
    generalRouteId,
    rootRoute,
} from './config/routes.config'

const AnalyticsApp: LazyLoadedComponent = lazyLoad(() => import('./AnalyticsApp'))
const CampaignAnalyticsPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/CampaignAnalyticsPage'),
    'CampaignAnalyticsPage',
)
const GeneralAnalyticsPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/GeneralAnalyticsPage'),
    'GeneralAnalyticsPage',
)

export const toolTitle: string = ToolTitle.analytics

export const analyticsRoutes: ReadonlyArray<PlatformRoute> = [{
    authRequired: true,
    children: [
        {
            authRequired: true,
            element: <Rewrite to={campaignsRouteId} />,
            rolesRequired: [UserRole.analytics],
            route: '',
        },
        {
            authRequired: true,
            element: <CampaignAnalyticsPage />,
            rolesRequired: [UserRole.analytics],
            route: campaignsRouteId,
        },
        {
            authRequired: true,
            element: <GeneralAnalyticsPage />,
            rolesRequired: [UserRole.analytics],
            route: generalRouteId,
        },
    ],
    domain: AppSubdomain.analytics,
    element: <AnalyticsApp />,
    id: toolTitle,
    rolesRequired: [UserRole.analytics],
    route: rootRoute,
    title: toolTitle,
}]
