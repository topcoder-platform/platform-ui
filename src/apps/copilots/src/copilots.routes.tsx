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

/**
 * Resolves the canonical absolute Copilots app root used for full-page and new-tab links.
 *
 * On Topcoder hosts, opening `/copilots/...` on the main site redirects to `www` and can
 * render the site-level 404 instead of the Copilots SPA. To keep direct opens working,
 * cross-app links target the dedicated Copilots subdomain. Non-Topcoder hosts such as
 * localhost keep the current-origin path fallback so local development still works.
 *
 * @param origin current browser origin.
 * @param subdomain active environment subdomain derived from the current host.
 * @param tcDomain configured Topcoder base domain such as `topcoder-dev.com`.
 * @returns canonical absolute Copilots root for the current runtime host.
 */
export function getCopilotsAbsoluteRootRoute(
    origin: string,
    subdomain: string,
    tcDomain: string,
): string {
    const currentOrigin = new URL(origin)
    if (subdomain === AppSubdomain.copilots) return currentOrigin.origin

    const normalizedDomain = tcDomain.toLowerCase()
    const hostname = currentOrigin.hostname.toLowerCase()
    const onTopcoderHost = hostname === normalizedDomain
        || hostname === `www.${normalizedDomain}`
        || hostname.endsWith(`.${normalizedDomain}`)

    return onTopcoderHost
        ? `${currentOrigin.protocol}//${AppSubdomain.copilots}.${normalizedDomain}`
        : `${currentOrigin.origin}${rootRoute}`
}

export const absoluteRootRoute: string = getCopilotsAbsoluteRootRoute(
    window.location.origin,
    EnvironmentConfig.SUBDOMAIN,
    EnvironmentConfig.TC_DOMAIN,
)

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
        route: rootRoute,
    },
]
