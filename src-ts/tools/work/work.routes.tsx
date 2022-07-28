import { Navigate } from 'react-router-dom'

import { contactSupportPath, PlatformRoute } from '../../lib'

import { dashboardTitle, default as Work, toolTitle } from './Work'
import { WorkLoginPrompt } from './work-login-prompt'
import { WorkNotLoggedIn } from './work-not-logged-in'
import {
    BugHuntIntakeForm,
    IntakeForms,
    intakeFormsTitle,
    Review,
} from './work-self-service'
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
        customerOnly: true,
        element: <WorkNotLoggedIn />,
        route: rootRoute,
        title: toolTitle,
    },
    {
        alternativePaths: [
            selfServiceRootRoute,
        ],
        authRequired: true,
        children: [
            {
                element: <WorkTable />,
                route: '',
            },
            // there doesn't seem to be support for optional path params
            // in react-router-dom v6, so duplicating route
            // https://reactrouter.com/docs/en/v6/getting-started/overview
            {
                element: <WorkTable />,
                route: ':statusKey',
            },
        ],
        element: <Work />,
        hidden: true,
        route: dashboardRoute,
        title: dashboardTitle,
    },
    {
        children: [
            // Bug Hunt
            {
                element: <BugHuntIntakeForm />,
                route: `bug-hunt/basic-info`,
            },
            {
                element: <BugHuntIntakeForm />,
                route: `bug-hunt/basic-info/:workId`,
            },
            {
                element: <Review />,
                route: `bug-hunt/review`,
            },
            {
                element: <Review />,
                route: `bug-hunt/review/:workId`,
            },
            // General
            {
                element: <WorkLoginPrompt />,
                route: `:workType/login-prompt`,
            },
            {
                element: <WorkThankYou />,
                route: `:workType/thank-you`,
            },
        ],
        element: <IntakeForms />,
        hidden: true,
        route: `/${selfServiceRootRoute}${rootRoute}/new`,
        title: intakeFormsTitle,
    },
    {
        element: <Navigate to={rootRoute} />,
        route: selfServiceRootRoute,
    },
    {
        element: <Navigate to={dashboardRoute} />,
        route: `${selfServiceRootRoute}/dashboard`,
    },
    {
        children: [],
        element: <Navigate to={contactSupportPath} />,
        route: `${rootRoute}/${contactSupportPath}`,
    },
]
