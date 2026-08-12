/** Platform route tree for the authenticated Support application. */
import { AppSubdomain, ToolTitle } from '~/config'
import {
    lazyLoad,
    LazyLoadedComponent,
    PlatformRoute,
} from '~/libs/core'

import {
    closedRouteId,
    rootRoute,
    ticketRouteId,
} from './config/routes.config'

const SupportApp: LazyLoadedComponent = lazyLoad(() => import('./SupportApp'))
const OpenTicketsPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/tickets/TicketsPage'),
    'OpenTicketsPage',
)
const ClosedTicketsPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/tickets/TicketsPage'),
    'ClosedTicketsPage',
)
const TicketDetailPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/ticket-details/TicketDetailPage'),
    'TicketDetailPage',
)

export const toolTitle: string = ToolTitle.support

export const supportRoutes: ReadonlyArray<PlatformRoute> = [{
    authRequired: true,
    children: [
        {
            authRequired: true,
            element: <OpenTicketsPage />,
            route: '',
        },
        {
            authRequired: true,
            element: <ClosedTicketsPage />,
            route: closedRouteId,
        },
        {
            authRequired: true,
            element: <TicketDetailPage />,
            route: ticketRouteId,
        },
    ],
    domain: AppSubdomain.support,
    element: <SupportApp />,
    id: toolTitle,
    route: rootRoute,
    title: toolTitle,
}]
