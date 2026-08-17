import { lazyLoad, LazyLoadedComponent, PlatformRoute } from '~/libs/core'
import { AppSubdomain, EnvironmentConfig, ToolTitle } from '~/config'

const CampusApp: LazyLoadedComponent = lazyLoad(() => import('./CampusApp'))
const CampusHomePage: LazyLoadedComponent = lazyLoad(
    () => import('./home'),
    'CampusHomePage',
)

export const rootRoute: string = (
    EnvironmentConfig.SUBDOMAIN === AppSubdomain.campus ? '' : `/${AppSubdomain.campus}`
)

export const toolTitle: string = ToolTitle.campus

export const campusRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: true,
        children: [
            {
                children: [],
                element: <CampusHomePage />,
                id: 'Campus Home',
                route: '',
            },
        ],
        domain: AppSubdomain.campus,
        element: <CampusApp />,
        id: toolTitle,
        route: rootRoute,
        title: toolTitle,
    },
]
