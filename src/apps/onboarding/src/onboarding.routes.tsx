import { Navigate } from 'react-router-dom'

import { ToolTitle } from '~/config/constants'
import { lazyLoad, LazyLoadedComponent, PlatformRoute, UserRole } from '~/libs/core'

const PageOnboarding: LazyLoadedComponent = lazyLoad(() => import('./pages/onboarding/index'), 'OnboardingWrapper')
const PageStart: LazyLoadedComponent = lazyLoad(() => import('./pages/start/index'), 'PageStart')
const PageSkills: LazyLoadedComponent = lazyLoad(() => import('./pages/skills/index'), 'PageSkills')
const toolTitle: string = ToolTitle.onboarding
const onboardingRootRoute: string = '/onboarding'

export const onboardRouteId: string = `${toolTitle} Onbarding`

export const onboardingRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: true,
        children: [
            {
                element: <Navigate to='./start' />,
                route: '/',
            },
            {
                element: <PageStart />,
                route: '/start',
                title: toolTitle,
            },
            {
                element: <PageSkills />,
                route: '/skills',
                title: toolTitle,
            },
        ],
        element: <PageOnboarding />,
        id: onboardRouteId,
        rolesRequired: [
            UserRole.member,
        ],
        route: onboardingRootRoute,
        title: toolTitle,
    },
]
