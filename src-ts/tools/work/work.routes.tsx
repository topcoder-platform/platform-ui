import { Navigate } from 'react-router-dom'

import { contactSupportPath, PlatformRoute } from '../../lib'

import Work, { toolTitle } from './Work'
import { WorkLoginPrompt } from './work-login-prompt'
import { WorkNotLoggedIn } from './work-not-logged-in'
import { BugHuntIntakeForm, Review } from './work-self-service'
import IntakeForms, { intakeFormsTitle } from './work-self-service/intake-forms/IntakeForms'
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
        requireAuth: true,
        route: dashboardRoute,
        title: `${toolTitle} Dashboard`,
    },
    {
        element: <Navigate to={rootRoute} />,
        route: selfServiceRootRoute,
    },
    {
        children: [
            // Bug Hunt
            {
                element: <BugHuntIntakeForm />,
                route: `bug-hunt/basic-info`,
                title: intakeFormsTitle,
            },
            {
                element: <BugHuntIntakeForm />,
                route: `bug-hunt/basic-info/:workId`,
                title: intakeFormsTitle,
            },
            {
                element: <Review />,
                route: `bug-hunt/review`,
                title: intakeFormsTitle,
            },
            {
                element: <Review />,
                route: `bug-hunt/review/:workId`,
                title: intakeFormsTitle,
            },
            // General
            {
                element: <WorkLoginPrompt />,
                route: `:workType/login-prompt`,
                title: intakeFormsTitle,
            },
            {
                element: <WorkThankYou />,
                route: `:workType/thank-you`,
                title: intakeFormsTitle,
            },
        ],
        customerOnly: true,
        element: <IntakeForms />,
        route: `/${selfServiceRootRoute}${rootRoute}/new`,
        title: intakeFormsTitle,
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
