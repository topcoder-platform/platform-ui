import { lazyLoad, LazyLoadedComponent, PlatformRoute } from '~/libs/core'
import { AppSubdomain, EnvironmentConfig, ToolTitle } from '~/config'

const ProfilesApp: LazyLoadedComponent = lazyLoad(() => import('./ProfilesApp'))
const MemberProfilePage: LazyLoadedComponent = lazyLoad(() => import('./member-profile'), 'MemberProfilePage')
const MemberBadgesPage: LazyLoadedComponent = lazyLoad(() => import('./member-badges'), 'MemberBadgesPage')
const ProfilesLandingPage: LazyLoadedComponent
    = lazyLoad(() => import('./profiles-landing-page'), 'ProfilesLandingPage')

export const rootRoute: string = (
    EnvironmentConfig.SUBDOMAIN === AppSubdomain.profiles ? '' : `/${AppSubdomain.profiles}`
)

export const toolTitle: string = ToolTitle.profiles
export const absoluteRootRoute: string = `${window.location.origin}${rootRoute}`

export const getUserProfileRoute = (userHandle?: string): string => (
    `${rootRoute}${!userHandle ? '' : `/${userHandle.toLowerCase()}`}`
)

export const getUserProfileStatsRoute = (
    userHandle: string,
    track?: string,
    subTrack?: string,
): string => (
    `${getUserProfileRoute(userHandle)}${track ? `/stats/${track}` : ''}${!(track && subTrack) ? '' : `/${subTrack}`}`
)

export const profilesRoutes: ReadonlyArray<PlatformRoute> = [
    {
        children: [
            {
                element: <ProfilesLandingPage />,
                id: 'ProfilesLandingPage',
                route: '',
            },
            {
                element: <MemberProfilePage />,
                id: 'MemberProfilePage',
                route: ':memberHandle',
            },
            {
                element: <MemberProfilePage />,
                id: 'MemberProfilePageSub',
                route: ':memberHandle/stats/*',
            },
            {
                element: <MemberBadgesPage />,
                id: 'MemberBadgesPage',
                route: ':memberHandle/badges',
            },
        ],
        domain: AppSubdomain.profiles,
        element: <ProfilesApp />,
        id: toolTitle,
        route: rootRoute,
    },
]
