/* eslint-disable max-len */
import { Navigate } from 'react-router-dom'

import { AppSubdomain, EnvironmentConfig, ToolTitle } from '~/config'
import { lazyLoad, LazyLoadedComponent, PlatformRoute, Rewrite } from '~/libs/core'

import { Work, WorkIntakeFormRoutes, WorkStatus, WorkType } from './lib'
import { bugHuntRoute, selfServiceRootRoute, selfServiceStartRoute, workDashboardRoute, workRootRoute } from './config'

const SelfServiceMyWork: LazyLoadedComponent = lazyLoad(() => import('./routes/self-service-my-work'), 'SelfServiceMyWork')
const SelfServiceWorkItem: LazyLoadedComponent = lazyLoad(() => import('./routes/self-service-work-item'), 'SelfServiceWorkItem')
const NotLoggedIn: LazyLoadedComponent = lazyLoad(() => import('./routes/not-logged-in'), 'NotLoggedIn')
const WorkDashboard: LazyLoadedComponent = lazyLoad(() => import('./containers/work-dashboard'), 'WorkDashboard')
const SelfServiceIntake: LazyLoadedComponent = lazyLoad(() => import('./routes/self-service-intake'), 'SelfServiceIntake')
const BugHuntIntakeForm: LazyLoadedComponent = lazyLoad(() => import('./routes/self-service-intake'), 'BugHuntIntakeForm')
const Review: LazyLoadedComponent = lazyLoad(() => import('./routes/self-service-intake'), 'Review')
const SaveAfterLogin: LazyLoadedComponent = lazyLoad(() => import('./routes/self-service-intake'), 'SaveAfterLogin')
const WorkThankYou: LazyLoadedComponent = lazyLoad(() => import('./routes/work-thank-you'), 'WorkThankYou')
const WorkLoginPrompt: LazyLoadedComponent = lazyLoad(() => import('./routes/work-login-prompt'), 'WorkLoginPrompt')
const SelectWorkType: LazyLoadedComponent = lazyLoad(() => import('./containers/select-work-type'), 'SelectWorkType')
const DataAdvisory: LazyLoadedComponent = lazyLoad(() => import('./routes/products'), 'DataAdvisory')
const DataExploration: LazyLoadedComponent = lazyLoad(() => import('./routes/products'), 'DataExploration')
const FindMeData: LazyLoadedComponent = lazyLoad(() => import('./routes/products'), 'FindMeData')
const WebsiteDesign: LazyLoadedComponent = lazyLoad(() => import('./routes/products'), 'WebsiteDesign')
const WebsiteDesignLegacy: LazyLoadedComponent = lazyLoad(() => import('./routes/legacy'), 'WebsiteDesignLegacy')

export const toolTitle: string = ToolTitle.selfService
export const workDashboardRouteId: string = `${toolTitle} Dashboard`
export const intakeFormsRouteId: string = `${toolTitle} Intake Forms`

export function getWorkDashboardRoute(active: string): string {
    return `${workDashboardRoute}/${active}`
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
] : []

export const selfServiceRoutes: ReadonlyArray<PlatformRoute> = [
    {
        element: <NotLoggedIn />,
        id: toolTitle,
        route: workRootRoute,
    },
    {
        alternativePaths: [
            selfServiceRootRoute,
        ],
        authRequired: true,
        children: [
            {
                element: <WorkDashboard />,
                route: '',
            },
            // there doesn't seem to be support for optional path params
            // in react-router-dom v6, so duplicating route
            // https://reactrouter.com/docs/en/v6/getting-started/overview
            {
                element: <WorkDashboard />,
                route: ':statusKey',
            },
        ],
        element: <SelfServiceMyWork />,
        id: workDashboardRouteId,
        route: workDashboardRoute,
        title: toolTitle,
    },
    {
        children: [
            {
                element: <Navigate to={selfServiceStartRoute} />,
                route: '/',
            },
            // Edit work item
            {
                element: <SelfServiceWorkItem />,
                route: '/work-items/:workItemId',
            },
            // WIZZARD
            {
                element: <SelectWorkType />,
                route: 'wizard',
            },
            {
                element: <DataAdvisory />,
                route: '/new/data-advisory/*',
            },
            {
                element: <DataExploration />,
                route: '/new/data-exploration/*',
            },
            {
                element: <FindMeData />,
                route: '/new/find-me-data/*',
            },
            {
                element: <WebsiteDesign />,
                route: '/new/website-design/*',
            },
            {
                element: <WebsiteDesignLegacy />,
                route: '/new/website-design-legacy/*',
            },
            // Bug Hunt
            {
                element: <BugHuntIntakeForm />,
                route: `/new/${bugHuntRoute}basic-info`,
            },
            {
                element: <BugHuntIntakeForm />,
                route: `/new/${bugHuntRoute}basic-info/:workId`,
            },
            {
                element: <Review />,
                route: `/new/${bugHuntRoute}review`,
            },
            {
                element: <Review />,
                route: `/new/${bugHuntRoute}review/:workId`,
            },
            {
                element: <WorkLoginPrompt previousPageUrl={WorkIntakeFormRoutes[WorkType.bugHunt].basicInfo} />,
                route: `/new/${bugHuntRoute}login-prompt/:retUrl`,
            },
            // General
            {
                element: <SaveAfterLogin />,
                route: '/new/:workType/save-after-login',
            },
            {
                element: <WorkThankYou />,
                route: '/new/:workType/thank-you',
            },
        ],
        element: <SelfServiceIntake />,
        id: intakeFormsRouteId,
        route: selfServiceRootRoute,
        title: toolTitle,
    },
    {
        element: <Navigate to={workDashboardRoute} />,
        route: selfServiceRootRoute,
    },
    {
        element: <Navigate to={workDashboardRoute} />,
        route: `${selfServiceRootRoute}/dashboard`,
    },
    ...oldUrlRedirectRoute,
]
