import { getRoutesContainer, lazyLoad, LazyLoadedComponent, PlatformRoute } from '~/libs/core'

import { reviewsRouteId } from '../../config/routes.config'

const ReviewsViewer: LazyLoadedComponent = lazyLoad(
    () => import('./ReviewsViewer'),
    'ReviewsViewer',
)

const ReviewsContextProvider: LazyLoadedComponent = lazyLoad(
    () => import('./ReviewsContext'),
    'ReviewsContextProvider',
)

export const reviewsChildRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: false,
        element: <ReviewsViewer />,
        id: 'view-reviews-page',
        route: '',
    },
]

export const reviewsRoutes: ReadonlyArray<PlatformRoute> = [
    {
        children: [...reviewsChildRoutes],
        element: getRoutesContainer(reviewsChildRoutes, ReviewsContextProvider),
        id: reviewsRouteId,
        route: `${reviewsRouteId}/:submissionId`,
    },
]
