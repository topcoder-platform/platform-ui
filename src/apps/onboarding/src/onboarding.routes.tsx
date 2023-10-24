import { Navigate } from 'react-router-dom'

import { EnvironmentConfig } from '~/config'
import { AppSubdomain, ToolTitle } from '~/config/constants'
import { lazyLoad, LazyLoadedComponent, PlatformRoute, UserRole } from '~/libs/core'

const PageOnboarding: LazyLoadedComponent = lazyLoad(() => import('./pages/onboarding/index'), 'OnboardingWrapper')
const PageSkills: LazyLoadedComponent = lazyLoad(() => import('./pages/skills/index'), 'PageSkills')
const PageOpenToWork: LazyLoadedComponent = lazyLoad(() => import('./pages/open-to-work/index'), 'PageOpenToWork')
const PageWorks: LazyLoadedComponent = lazyLoad(() => import('./pages/works/index'), 'PageWorks')
const PageEducations: LazyLoadedComponent = lazyLoad(() => import('./pages/educations/index'), 'PageEducations')
const PagePersonalization: LazyLoadedComponent = lazyLoad(
    () => import('./pages/personalization/index'),
    'PagePersonalization',
)
const toolTitle: string = ToolTitle.onboarding

export const rootRoute: string = (
    EnvironmentConfig.SUBDOMAIN === AppSubdomain.onboarding ? '' : `/${AppSubdomain.onboarding}`
)

export const onboardRouteId: string = `${toolTitle} Onbarding`

export const onboardingRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: true,
        children: [
            {
                element: <PageSkills />,
                route: '/skills',
            },
            {
                element: <PageOpenToWork />,
                route: '/open-to-work',
            },
            {
                element: <PageWorks />,
                route: '/works',
            },
            {
                element: <PageEducations />,
                route: '/educations',
            },
            {
                element: <PagePersonalization />,
                route: '/personalization',
            },
            {
                element: <Navigate to='./skills' />,
                route: '/*',
            },
        ],
        domain: AppSubdomain.onboarding,
        element: <PageOnboarding />,
        id: onboardRouteId,
        rolesRequired: [
            UserRole.member,
        ],
        route: rootRoute,
        title: toolTitle,
    },
]
