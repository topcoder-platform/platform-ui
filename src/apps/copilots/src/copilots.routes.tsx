import { lazyLoad, LazyLoadedComponent, PlatformRoute, UserRole } from '~/libs/core'
import { AppSubdomain, EnvironmentConfig, ToolTitle } from '~/config'

const CopilotsApp: LazyLoadedComponent = lazyLoad(() => import('./CopilotsApp'))
const CopilotOpportunityList: LazyLoadedComponent = lazyLoad(() => import('./pages/copilot-opportunity-list/index'))
const CopilotsRequests: LazyLoadedComponent = lazyLoad(() => import('./pages/copilot-requests/index'))
const CopilotsRequestForm: LazyLoadedComponent = lazyLoad(() => import('./pages/copilot-request-form/index'))
const CopilotOpportunityDetails: LazyLoadedComponent = lazyLoad(
    () => import('./pages/copilot-opportunity-details/index'),
)

export const rootRoute: string = (
    EnvironmentConfig.SUBDOMAIN === AppSubdomain.copilots ? '' : `/${AppSubdomain.copilots}`
)

export const toolTitle: string = ToolTitle.copilots
export const absoluteRootRoute: string = `${window.location.origin}${rootRoute}`

export const childRoutes = [
    {
        element: <CopilotOpportunityList />,
        id: 'CopilotOpportunityList',
        route: '/',
    },
    {
        authRequired: true,
        element: <CopilotsRequests />,
        id: 'CopilotRequests',
        route: '/requests',
    },
    {
        authRequired: true,
        element: <CopilotsRequestForm />,
        id: 'CopilotRequestForm',
        rolesRequired: [UserRole.administrator, UserRole.projectManager] as UserRole[],
        route: '/requests/new',
    },
    {
        authRequired: true,
        element: <CopilotsRequestForm />,
        id: 'CopilotRequestEditForm',
        rolesRequired: [UserRole.administrator, UserRole.projectManager] as UserRole[],
        route: '/requests/edit/:requestId',
    },
    {
        authRequired: true,
        element: <CopilotsRequests />,
        id: 'CopilotRequestDetails',
        route: '/requests/:requestId',
    },
    {
        element: <CopilotOpportunityDetails />,
        id: 'CopilotOpportunityDetails',
        route: '/opportunity/:opportunityId',
    },
] as const

type RouteMap = {
    [K in (typeof childRoutes)[number]['id']]: Extract<(typeof childRoutes)[number], { id: K }>['route'];
};

export const copilotRoutesMap = childRoutes.reduce((allRoutes, route) => (
    Object.assign(allRoutes, { [route.id]: `${rootRoute}${route.route}` })
), {} as RouteMap)

export const copilotsRoutes: ReadonlyArray<PlatformRoute> = [
    {
        children: [
            ...childRoutes,
        ],
        domain: AppSubdomain.copilots,
        element: <CopilotsApp />,
        id: toolTitle,
        rolesRequired: [
            UserRole.administrator,
            UserRole.projectManager,
        ],
        route: rootRoute,
    },
]
