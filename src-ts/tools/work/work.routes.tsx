import { Navigate } from 'react-router-dom'

import { PlatformRoute } from '../../lib'

import Work, { toolTitle } from './Work'
import { WorkLoginPrompt } from './work-login-prompt'
import { WorkNotLoggedIn } from './work-not-logged-in'
import { BugHuntIntakeForm, Review } from './work-self-service'
import { WorkTable } from './work-table'
import { WorkThankYou } from './work-thank-you'

export const rootRoute: string = '/work'
export const selfServiceRootRoute: string = '/self-service'
export const selfServiceStartRoute: string = `${selfServiceRootRoute}/wizard`
export const dashboardRoute: string = `${rootRoute}/dashboard`

export function workDetailRoute(workId: string, tab?: string): string {
    return `${selfServiceRootRoute}/work-items/${workId}${!!tab ? `\?tab=${tab}` : ''}`
}

export const workRoutes: Array<PlatformRoute> = [
    {
        element: <WorkNotLoggedIn />,
        route: rootRoute,
    },
    {
        alternativePaths: [selfServiceRootRoute],
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
        customerOnly: true,
        element: <Work />,
        requireAuth: true,
        route: dashboardRoute,
        title: toolTitle,
    },
    {
        element: <Navigate to={rootRoute} />,
        route: selfServiceRootRoute,
    },
    {
        element: <BugHuntIntakeForm />,
        route: `/${selfServiceRootRoute}/work/new/bug-hunt/basic-info`,
    },
    {
        element: <BugHuntIntakeForm />,
        route: `/${selfServiceRootRoute}/work/new/bug-hunt/basic-info/:workId`,
    },
    {
        element: <WorkLoginPrompt />,
        route: `/${selfServiceRootRoute}${rootRoute}/new/:workType/login-prompt`,
    },
    {
        element: <Review />,
        route: `/${selfServiceRootRoute}/work/new/bug-hunt/review`,
    },
    {
        element: <Review />,
        route: `/${selfServiceRootRoute}/work/new/bug-hunt/review/:workId`,
    },
    {
        element: <WorkThankYou />,
        route: `/${selfServiceRootRoute}${rootRoute}/new/:workType/thank-you`,
    },
    {
        element: <Navigate to={dashboardRoute} />,
        route: `${selfServiceRootRoute}/dashboard`,
    },
]
