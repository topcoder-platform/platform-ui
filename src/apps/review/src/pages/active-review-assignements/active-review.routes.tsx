import { getRoutesContainer, lazyLoad, LazyLoadedComponent } from '~/libs/core'

import { activeReviewAssignmentsRouteId } from '../../config/routes.config'

import { challengeDetailsRoutes } from './challenge-details.routes'

const ActiveReviewsPage: LazyLoadedComponent = lazyLoad(
    () => import('./ActiveReviewsPage'),
    'ActiveReviewsPage',
)

export const activeReviewChildRoutes = [
    {
        authRequired: true,
        element: <ActiveReviewsPage />,
        id: 'active-reviews-page',
        route: '',
    },
    ...challengeDetailsRoutes,
]

export const activeReviewRoutes = [
    {
        children: [...activeReviewChildRoutes],
        element: getRoutesContainer(activeReviewChildRoutes),
        id: activeReviewAssignmentsRouteId,
        route: activeReviewAssignmentsRouteId,
    },
]
