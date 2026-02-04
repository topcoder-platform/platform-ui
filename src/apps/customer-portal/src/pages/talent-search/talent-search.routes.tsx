import { getRoutesContainer, lazyLoad, LazyLoadedComponent } from '~/libs/core'

import { talentSearchRouteId } from '../../config/routes.config'

const TalentSearchPage: LazyLoadedComponent = lazyLoad(
    () => import('./TalentSearchPage'),
    'TalentSearchPage',
)

export const talentSearchChildRoutes = [
    {
        authRequired: true,
        element: <TalentSearchPage />,
        id: 'talent-search-page',
        route: '',
    },
]

export const customerPortalTalentSearchRoutes = [
    {
        children: [...talentSearchChildRoutes],
        element: getRoutesContainer(talentSearchChildRoutes),
        id: talentSearchRouteId,
        route: talentSearchRouteId,
    },
]
