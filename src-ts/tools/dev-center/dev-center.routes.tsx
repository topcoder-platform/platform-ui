import { PlatformRoute } from '../../lib'

import GettingStartedGuide from './dev-center-pages/community-app/getting-started/GettingStartedGuide'
import DevCenterLandingPage from './dev-center-pages/community-app/landing-page/DevCenterLandingPage'
import DevCenter, { toolTitle } from './DevCenter'

export const devCenterRoutes: Array<PlatformRoute> = [
    {
        children: [
            {
                element: <GettingStartedGuide />,
                route: '/getting-started',
                title: toolTitle,
            },
            {
                element: <DevCenterLandingPage />,
                route: '/',
                title: toolTitle,
            },
        ],
        element: <DevCenter />,
        route: '/dev-center',
        title: toolTitle,
    },
]
