import { Navigate } from 'react-router-dom'

import { PlatformRoute } from '../../lib'

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
        children: [],
        element: <Navigate to={rootRoute} />,
        hide: true,
        route: '',
        title: 'Redirect the base path to the logged out landing',
    },
    {
        element: <WorkNotLoggedIn />,
        hide: true,
        route: rootRoute,
        title: 'Logged Out Landing',
    },
    {
        alternativePaths: ['/self-service', '/work'],
        children: [
            {
                element: <WorkTable />,
                route: '',
                title: toolTitle,
            },
            // there doesn't seem to be support for optional path params
            // in react-router-dom v6, so duplicating route
            // https://reactrouter.com/docs/en/v6/getting-started/overview
            {
                element: <WorkTable />,
                route: ':statusKey',
                title: toolTitle,
            },
        ],
        element: <Work />,
        requireAuth: true,
        route: dashboardRoute,
        title: toolTitle,
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
]
