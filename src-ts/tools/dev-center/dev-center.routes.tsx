import { AppSubdomain, EnvironmentConfig, ToolTitle } from '../../config'
import { lazyLoad, LazyLoadedComponent, PlatformRoute } from '../../lib'

const GettingStartedGuide: LazyLoadedComponent
    = lazyLoad(() => import('./dev-center-pages/community-app/getting-started/GettingStartedGuide'))

const DevCenterLandingPage: LazyLoadedComponent
    = lazyLoad(() => import('./dev-center-pages/community-app/landing-page/DevCenterLandingPage'))

const DevCenter: LazyLoadedComponent = lazyLoad(() => import('./DevCenter'))

export const rootRoute: string = EnvironmentConfig.SUBDOMAIN === AppSubdomain.dev ? '' : `/${AppSubdomain.dev}`
export const toolTitle: string = ToolTitle.dev

export const devCenterRoutes: ReadonlyArray<PlatformRoute> = [
    {
        children: [
            {
                element: <GettingStartedGuide />,
                route: '/getting-started',
            },
            {
                element: <DevCenterLandingPage />,
                route: '/',
            },
        ],
        domain: 'devcenter',
        element: <DevCenter />,
        id: toolTitle,
        route: rootRoute,
    },
]
