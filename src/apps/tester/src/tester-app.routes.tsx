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

import { flowsRouteId, rootRoute } from './config/routes.config'
import { FlowsPage } from './pages'

const TesterApp: LazyLoadedComponent = lazyLoad(() => import('./TesterApp'))

export const toolTitle: string = ToolTitle.tester

export const testerRoutes: ReadonlyArray<PlatformRoute> = [
    // Tester App Root
    {
        authRequired: true,
        children: [
            {
                element: <Rewrite to={flowsRouteId} />,
                route: '',
            },
            {
                element: <FlowsPage />,
                id: flowsRouteId,
                route: flowsRouteId,
            },
        ],
        domain: AppSubdomain.tester,
        element: <TesterApp />,
        id: toolTitle,
        route: rootRoute,
        title: toolTitle,
    },
]
