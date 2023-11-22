import { lazyLoad, LazyLoadedComponent, PlatformRoute } from '~/libs/core'

export const rootRoute: string = '/skills-manager'

const SkillsManager: LazyLoadedComponent = lazyLoad(() => import('./SkillsManager'))
const LandingPage: LazyLoadedComponent = lazyLoad(() => import('./landing-page'), 'LandingPage')

export const skillsManagerRoutes: ReadonlyArray<PlatformRoute> = [
    {
        element: <LandingPage />,
        route: '',
    },
]

export const skillsManagerMainRoute: ReadonlyArray<PlatformRoute> = [
    {
        children: [
            ...skillsManagerRoutes,
        ],
        element: <SkillsManager />,
        id: 'Skills Manager',
        route: rootRoute,
    },
]
