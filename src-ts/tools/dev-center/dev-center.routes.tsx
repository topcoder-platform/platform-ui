import { lazyLoad, PlatformRoute } from '../../lib'

const GettingStartedGuide = lazyLoad(() => import('./dev-center-pages/community-app/getting-started/GettingStartedGuide'))
const DevCenterLandingPage = lazyLoad(() => import('./dev-center-pages/community-app/landing-page/DevCenterLandingPage'))
const DevCenter = lazyLoad(() => import('./DevCenter'))

export const toolTitle: string = 'Dev Center'

export const devCenterRoutes: Array<PlatformRoute> = [
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
        element: <DevCenter />,
        memberOnly: true,
        route: '/dev-center',
        title: toolTitle,
    },
]
