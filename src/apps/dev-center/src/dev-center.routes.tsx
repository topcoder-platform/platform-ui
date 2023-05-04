import { ToolTitle } from '~/config'
import { lazyLoad, LazyLoadedComponent, PlatformRoute } from '~/libs/core'

const Storybook: LazyLoadedComponent
    = lazyLoad(() => import('./dev-center-pages/platform-ui-app/storybook/Storybook'))

const GettingStartedGuide: LazyLoadedComponent
    = lazyLoad(() => import('./dev-center-pages/community-app/getting-started/GettingStartedGuide'))

const DevCenterLandingPage: LazyLoadedComponent
    = lazyLoad(() => import('./dev-center-pages/community-app/landing-page/DevCenterLandingPage'))

const DevCenter: LazyLoadedComponent = lazyLoad(() => import('./DevCenter'))

export const toolTitle: string = ToolTitle.devCenter

export const devCenterRoutes: ReadonlyArray<PlatformRoute> = [
    {
        children: [
            {
                element: <Storybook />,
                route: '/storybook',
            },
            {
                element: <GettingStartedGuide />,
                route: '/getting-started',
            },
            {
                element: <DevCenterLandingPage />,
                route: '/',
            },
        ],
        element: <DevCenter />,
        id: toolTitle,
        route: '/dev-center',
    },
]
