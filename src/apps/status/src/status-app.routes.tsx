/**
 * Platform routes for the administrator-only Status application.
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
    apiRouteId,
    databaseRouteId,
    ecsRouteId,
    rootRoute,
    sendgridRouteId,
} from './config/routes.config'

const StatusApp: LazyLoadedComponent = lazyLoad(() => import('./StatusApp'))
const EcsStatusPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/ecs/EcsStatusPage'),
    'EcsStatusPage',
)
const ApiStatusPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/api/ApiStatusPage'),
    'ApiStatusPage',
)
const ApiEndpointsPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/api/ApiEndpointsPage'),
    'ApiEndpointsPage',
)
const ApiFailuresPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/api/ApiFailuresPage'),
    'ApiFailuresPage',
)
const SendgridStatusPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/sendgrid/SendgridStatusPage'),
    'SendgridStatusPage',
)
const DatabaseStatusPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/database/DatabaseStatusPage'),
    'DatabaseStatusPage',
)

export const toolTitle: string = ToolTitle.status

export const statusRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: true,
        children: [
            {
                authRequired: true,
                element: <Rewrite to={ecsRouteId} />,
                rolesRequired: [UserRole.administrator],
                route: '',
            },
            {
                authRequired: true,
                element: <EcsStatusPage />,
                rolesRequired: [UserRole.administrator],
                route: ecsRouteId,
            },
            {
                authRequired: true,
                element: <ApiStatusPage />,
                rolesRequired: [UserRole.administrator],
                route: apiRouteId,
            },
            {
                authRequired: true,
                element: <ApiEndpointsPage />,
                rolesRequired: [UserRole.administrator],
                route: `${apiRouteId}/:serviceId`,
            },
            {
                authRequired: true,
                element: <ApiFailuresPage />,
                rolesRequired: [UserRole.administrator],
                route: `${apiRouteId}/:serviceId/endpoints/:endpointId`,
            },
            {
                authRequired: true,
                element: <SendgridStatusPage />,
                rolesRequired: [UserRole.administrator],
                route: sendgridRouteId,
            },
            {
                authRequired: true,
                element: <DatabaseStatusPage />,
                rolesRequired: [UserRole.administrator],
                route: databaseRouteId,
            },
        ],
        domain: AppSubdomain.status,
        element: <StatusApp />,
        id: toolTitle,
        rolesRequired: [UserRole.administrator],
        route: rootRoute,
        title: toolTitle,
    },
]
