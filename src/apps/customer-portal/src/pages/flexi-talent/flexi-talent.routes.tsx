import { getRoutesContainer, lazyLoad, LazyLoadedComponent } from '~/libs/core'

import { flexiTalentRouteId } from '../../config/routes.config'

const FlexiTalentPage: LazyLoadedComponent = lazyLoad(
    () => import('./FlexiTalentPage'),
    'FlexiTalentPage',
)

export const flexiTalentChildRoutes = [
    {
        authRequired: true,
        element: <FlexiTalentPage />,
        id: 'flexi-talent-page',
        route: '',
    },
]

export const customerPortalFlexiTalentRoutes = [
    {
        children: [...flexiTalentChildRoutes],
        element: getRoutesContainer(flexiTalentChildRoutes),
        id: flexiTalentRouteId,
        route: flexiTalentRouteId,
    },
]
