import { getRoutesContainer, lazyLoad, LazyLoadedComponent } from '~/libs/core'

import { profileCompletionRouteId } from '../../config/routes.config'

const ProfileCompletionPage: LazyLoadedComponent = lazyLoad(
    () => import('./ProfileCompletionPage'),
    'ProfileCompletionPage',
)

export const profileCompletionChildRoutes = [
    {
        authRequired: true,
        element: <ProfileCompletionPage />,
        id: 'profile-completion-page',
        route: '',
    },
]

export const customerPortalProfileCompletionRoutes = [
    {
        children: [...profileCompletionChildRoutes],
        element: getRoutesContainer(profileCompletionChildRoutes),
        id: profileCompletionRouteId,
        route: profileCompletionRouteId,
    },
]
