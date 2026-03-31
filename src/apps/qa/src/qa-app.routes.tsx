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

import { qaHomeRouteId, rootRoute } from './config/routes.config'

const QaApp: LazyLoadedComponent = lazyLoad(() => import('./QaApp'))
const QaHomePage: LazyLoadedComponent = lazyLoad(
    () => import('./QaHomePage'),
    'QaHomePage',
)

export const toolTitle: string = ToolTitle.qa

export const qaRoutes: ReadonlyArray<PlatformRoute> = [
    // QA App Root
    {
        authRequired: true,
        children: [
            {
                authRequired: true,
                element: <Rewrite to={qaHomeRouteId} />,
                route: '',
            },
            {
                authRequired: true,
                element: <QaHomePage />,
                id: qaHomeRouteId,
                route: qaHomeRouteId,
            },
        ],
        domain: AppSubdomain.qa,
        element: <QaApp />,
        id: toolTitle,
        rolesRequired: [UserRole.tester],
        route: rootRoute,
        title: toolTitle,
    },
]
