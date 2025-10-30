import { getRoutesContainer, lazyLoad, LazyLoadedComponent } from '~/libs/core'

import { pastReviewAssignmentsRouteId } from '../../config/routes.config'
import { challengeDetailsRoutes } from '../active-review-assignements'

const PastReviewsPage: LazyLoadedComponent = lazyLoad(
    () => import('./PastReviewsPage'),
    'PastReviewsPage',
)

export const pastReviewChildRoutes = [
    {
        authRequired: true,
        element: <PastReviewsPage />,
        id: 'past-reviews-page',
        route: '',
    },
    ...challengeDetailsRoutes,
]

export const pastReviewRoutes = [
    {
        children: pastReviewChildRoutes,
        element: getRoutesContainer(pastReviewChildRoutes),
        id: pastReviewAssignmentsRouteId,
        route: pastReviewAssignmentsRouteId,
    },
]
