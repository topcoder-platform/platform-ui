import { Navigate } from 'react-router-dom'

import { contactSupportPath, lazyLoad, LazyLoadedComponent, PlatformRoute, Rewrite } from '../../lib'
import { AppSubdomain, EnvironmentConfig } from '../../config'

import { dashboardRouteId, intakeFormsRouteId, toolTitle } from './Work'
import { Work, WorkIntakeFormRoutes, WorkStatus, WorkType } from './work-lib'
import { WorkLoginPrompt } from './work-login-prompt'

const WorkComponent: LazyLoadedComponent = lazyLoad(() => import('./Work'))
const WorkNotLoggedIn: LazyLoadedComponent = lazyLoad(() => import('./work-not-logged-in'), 'WorkNotLoggedIn')
const BugHuntIntakeForm: LazyLoadedComponent = lazyLoad(() => import('./work-self-service'), 'BugHuntIntakeForm')
const IntakeForms: LazyLoadedComponent = lazyLoad(() => import('./work-self-service'), 'IntakeForms')
const Review: LazyLoadedComponent = lazyLoad(() => import('./work-self-service'), 'Review')
const SaveAfterLogin: LazyLoadedComponent
    = lazyLoad(() => import('./work-self-service/intake-forms/save-after-login/SaveAfterLogin'))
const WorkTable: LazyLoadedComponent = lazyLoad(() => import('./work-table'), 'WorkTable')
const WorkThankYou: LazyLoadedComponent = lazyLoad(() => import('./work-thank-you'), 'WorkThankYou')

export const rootRoute: string = EnvironmentConfig.SUBDOMAIN === AppSubdomain.work ? '' : `/${AppSubdomain.work}`
export const selfServiceRootRoute: string = `${rootRoute}/self-service`
export const selfServiceStartRoute: string = `${selfServiceRootRoute}/wizard`
export const dashboardRoute: string = `${rootRoute}/dashboard`
export const bugHuntRoute: string = 'bug-hunt/'

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
    return `${selfServiceRootRoute}/work-items/${workId}${!!tab ? `?tab=${tab}` : ''}`
}

const oldUrlRedirectRoute: ReadonlyArray<PlatformRoute> = EnvironmentConfig.SUBDOMAIN === AppSubdomain.work ? [
    {
        children: [],
        element: <Rewrite to='/*' />,
        id: 'redirect-old-url',
        route: '/work/*',
    },
    {
        children: [],
        element: <Rewrite to='/self-service/*' />,
        id: 'redirect-old-url',
        route: '/self-service/work/*',
    },
] : []

export const workRoutes: ReadonlyArray<PlatformRoute> = [
    {
        element: <WorkNotLoggedIn />,
        id: toolTitle,
        route: rootRoute,
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
        id: dashboardRouteId,
        route: dashboardRoute,
        title: toolTitle,
    },
    {
        children: [
            // Bug Hunt
            {
                element: <BugHuntIntakeForm />,
                route: `${bugHuntRoute}basic-info`,
            },
            {
                element: <BugHuntIntakeForm />,
                route: `${bugHuntRoute}basic-info/:workId`,
            },
            {
                element: <Review />,
                route: `${bugHuntRoute}review`,
            },
            {
                element: <Review />,
                route: `${bugHuntRoute}review/:workId`,
            },
            {
                element: <WorkLoginPrompt previousPageUrl={WorkIntakeFormRoutes[WorkType.bugHunt].basicInfo} />,
                route: `${bugHuntRoute}login-prompt/:retUrl`,
            },
            // General
            {
                element: <SaveAfterLogin />,
                route: ':workType/save-after-login',
            },
            {
                element: <WorkThankYou />,
                route: ':workType/thank-you',
            },
        ],
        element: <IntakeForms />,
        hidden: true,
        id: intakeFormsRouteId,
        route: `${selfServiceRootRoute}/new`,
        title: toolTitle,
    },
    {
        element: <Navigate to={dashboardRoute} />,
        route: `${selfServiceRootRoute}/dashboard`,
    },
    {
        element: <Navigate to={selfServiceStartRoute} />,
        route: selfServiceRootRoute,
    },
    {
        children: [],
        element: <Navigate to={contactSupportPath} />,
        route: `${contactSupportPath}`,
    },
    ...oldUrlRedirectRoute,
]
