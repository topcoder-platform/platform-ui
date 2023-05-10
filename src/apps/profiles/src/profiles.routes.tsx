import { lazyLoad, LazyLoadedComponent, PlatformRoute } from '~/libs/core'
import { AppSubdomain, EnvironmentConfig, ToolTitle } from '~/config'

const ProfilesApp: LazyLoadedComponent = lazyLoad(() => import('./ProfilesApp'))

export const rootRoute: string = (
    EnvironmentConfig.SUBDOMAIN === AppSubdomain.profiles ? '' : `/${AppSubdomain.profiles}`
)

export const toolTitle: string = ToolTitle.profiles
export const absoluteRootRoute: string = `${window.location.origin}${rootRoute}`

export const profilesRoutes: ReadonlyArray<PlatformRoute> = [
    {
        children: [
        ],
        domain: AppSubdomain.profiles,
        element: <ProfilesApp />,
        id: toolTitle,
        route: rootRoute,
    },
]
