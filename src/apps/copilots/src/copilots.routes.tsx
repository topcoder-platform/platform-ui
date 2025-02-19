import { lazyLoad, LazyLoadedComponent, PlatformRoute, Rewrite, UserRole } from '~/libs/core'
import { AppSubdomain, EnvironmentConfig, ToolTitle } from '~/config'

const CopilotsApp: LazyLoadedComponent = lazyLoad(() => import('./CopilotsApp'))
const CopilotsRequests: LazyLoadedComponent = lazyLoad(() => import('./pages/copilot-requests/index'))
const CopilotsRequestForm: LazyLoadedComponent = lazyLoad(() => import('./pages/copilot-request-form/index'))

export const rootRoute: string = (
    EnvironmentConfig.SUBDOMAIN === AppSubdomain.copilots ? '' : `/${AppSubdomain.copilots}`
)

export const toolTitle: string = ToolTitle.copilots
export const absoluteRootRoute: string = `${window.location.origin}${rootRoute}`

export const childRoutes = [
    {
        element: <CopilotsRequests />,
        id: 'CopilotRequests',
        route: 'requests',
    },
    {
        element: <CopilotsRequestForm />,
        id: 'CopilotRequestForm',
        route: 'requests/new',
    },
    {
        element: <CopilotsRequests />,
        id: 'CopilotRequestDetails',
        route: 'requests/:requestId',
    },
] as const

type RouteMap = {
    [K in (typeof childRoutes)[number]['id']]: Extract<(typeof childRoutes)[number], { id: K }>['route'];
};

export const copilotRoutesMap = childRoutes.reduce((allRoutes, route) => (
    Object.assign(allRoutes, { [route.id]: `${rootRoute}/${route.route}` })
), {} as RouteMap)

export const copilotsRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: true,
        children: [
            {
                element: <Rewrite to={childRoutes[0].route} />,
                route: '',
            },
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
