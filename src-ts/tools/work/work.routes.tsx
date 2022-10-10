import { Navigate } from 'react-router-dom'

import { contactSupportPath, lazyLoad, PlatformRoute } from '../../lib'

import { dashboardTitle, toolTitle } from './Work'
import { Work, WorkIntakeFormRoutes, WorkStatus } from './work-lib'
import { WorkLoginPrompt } from './work-login-prompt'
import { intakeFormsTitle } from './work-self-service'

const WorkComponent = lazyLoad(() => import('./Work'))
const WorkNotLoggedIn = lazyLoad(() => import('./work-not-logged-in'), 'WorkNotLoggedIn')
const BugHuntIntakeForm = lazyLoad(() => import('./work-self-service'), 'BugHuntIntakeForm')
const IntakeForms = lazyLoad(() => import('./work-self-service'), 'IntakeForms')
const Review = lazyLoad(() => import('./work-self-service'), 'Review')

const SaveAfterLogin = lazyLoad(() => import('./work-self-service/intake-forms/save-after-login/SaveAfterLogin'))
const WorkTable = lazyLoad(() => import('./work-table'), 'WorkTable')
const WorkThankYou = lazyLoad(() => import('./work-thank-you'), 'WorkThankYou')

export const rootRoute: string = '/work'
export const selfServiceRootRoute: string = '/self-service'
export const selfServiceStartRoute: string = `${selfServiceRootRoute}/wizard`
export const dashboardRoute: string = `${rootRoute}/dashboard`

export function workDashboardRoute(active: string): string {
    return `${dashboardRoute}/${active}`
}

export function workDetailOrDraftRoute(selectedWork: Work): string {

    // if this isn't a draft, just go to the detail
    if (selectedWork.status !== WorkStatus.draft) {
        // TODO: move the tabs definition to src-ts
        // so we don't have to hard-code the 'solutions' tab id
        return workDetailRoute(selectedWork.id, selectedWork.status === WorkStatus.ready ? 'solutions' : undefined)
    }

    // if we have a draft step, go to it
    if (!!selectedWork.draftStep) {
        return `${WorkIntakeFormRoutes[selectedWork.type][selectedWork.draftStep]}/${selectedWork.id}`
    }

    // return the base route
    return selfServiceStartRoute
}

export function workDetailRoute(workId: string, tab?: 'solutions' | 'messages'): string {
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
        element: <WorkComponent />,
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
            {
                element: <WorkLoginPrompt />,
                route: `bug-hunt/login-prompt/:retUrl`,
            },
            // General
            {
                element: <SaveAfterLogin />,
                route: `:workType/save-after-login`,
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
