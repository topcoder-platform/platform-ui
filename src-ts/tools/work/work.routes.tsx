import { Navigate } from 'react-router-dom'

import { contactSupportPath, PlatformRoute } from '../../lib'

import Work, { toolTitle } from './Work'
import { WorkNotLoggedIn } from './work-not-logged-in'
import { WorkTable } from './work-table'

export const rootRoute: string = '/work'
export const selfServiceRootRoute: string = '/self-service'
export const selfServiceStartRoute: string = `${selfServiceRootRoute}/wizard`
export const dashboardRoute: string = `${rootRoute}/dashboard`

export function workDetailRoute(workId: string, tab?: string): string {
    return `${selfServiceRootRoute}/work-items/${workId}${!!tab ? `\?tab=${tab}` : ''}`
}

export const workRoutes: Array<PlatformRoute> = [
    {
        customerOnly: true,
        element: <WorkNotLoggedIn />,
        route: rootRoute,
        title: toolTitle,
    },
    {
        alternativePaths: [selfServiceRootRoute],
        children: [
            {
                element: <WorkTable />,
                route: '',
                title: `${toolTitle} Dashboard Active`,
            },
            // there doesn't seem to be support for optional path params
            // in react-router-dom v6, so duplicating route
            // https://reactrouter.com/docs/en/v6/getting-started/overview
            {
                element: <WorkTable />,
                route: ':statusKey',
                title: `${toolTitle} Dashboard Status`,
            },
        ],
        customerOnly: true,
        element: <Work />,
        hide: true,
        requireAuth: true,
        route: dashboardRoute,
        title: `${toolTitle} Dashboard`,
    },
    {
        element: <Navigate to={rootRoute} />,
        hide: true,
        route: selfServiceRootRoute,
        title: 'Obsolete Self Service Logged Out Landing',
    },
    {
        element: <Navigate to={dashboardRoute} />,
        hide: true,
        route: `${selfServiceRootRoute}/dashboard`,
        title: 'Obsolete Self Service Dashboard',
    },
    {
        children: [],
        element: <Navigate to={contactSupportPath} />,
        hide: true,
        route: `${rootRoute}/${contactSupportPath}`,
        title: 'Obsolete Self Service Support page',
    },
]
