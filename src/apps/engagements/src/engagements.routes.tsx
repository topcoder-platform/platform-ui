import { lazyLoad, LazyLoadedComponent, PlatformRoute } from '~/libs/core'
import { AppSubdomain, EnvironmentConfig, ToolTitle } from '~/config'

const EngagementsApp: LazyLoadedComponent = lazyLoad(() => import('./EngagementsApp'))

const EngagementListPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/engagement-list'),
    'EngagementListPage',
)
const EngagementDetailPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/engagement-detail'),
    'EngagementDetailPage',
)
const ApplicationFormPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/application-form'),
    'ApplicationFormPage',
)
const MyApplicationsPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/my-applications'),
    'MyApplicationsPage',
)
const MyAssignmentsPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/my-assignments'),
    'MyAssignmentsPage',
)

export const rootRoute: string = (
    EnvironmentConfig.SUBDOMAIN === AppSubdomain.engagements ? '' : `/${AppSubdomain.engagements}`
)

export const toolTitle: string = ToolTitle.engagements
export const absoluteRootRoute: string = `${window.location.origin}${rootRoute}`

export const engagementsRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: false,
        children: [
            {
                children: [],
                element: <EngagementListPage />,
                id: 'Engagement List',
                route: '',
            },
            {
                children: [],
                element: <EngagementDetailPage />,
                id: 'Engagement Detail',
                route: ':nanoId',
            },
            {
                authRequired: true,
                children: [],
                element: <ApplicationFormPage />,
                id: 'Application Form',
                route: ':nanoId/apply',
            },
            {
                authRequired: true,
                children: [],
                element: <MyApplicationsPage />,
                id: 'My Applications',
                route: 'my-applications',
            },
            {
                authRequired: true,
                children: [],
                element: <MyAssignmentsPage />,
                id: 'My Assignments',
                route: 'assignments',
            },
        ],
        domain: AppSubdomain.engagements,
        element: <EngagementsApp />,
        id: toolTitle,
        route: rootRoute,
        title: toolTitle,
    },
]
