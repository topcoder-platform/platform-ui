import { getRoutesContainer, lazyLoad, LazyLoadedComponent } from '~/libs/core'

import { challengeDetailRouteId } from '../../config/routes.config'
import { reviewsRoutes } from '../reviews'

const ChallengeDetailContextProvider: LazyLoadedComponent = lazyLoad(
    () => import('../../lib/contexts/ChallengeDetailContextProvider'),
    'ChallengeDetailContextProvider',
)

const ChallengeDetailsPage: LazyLoadedComponent = lazyLoad(
    () => import('./ChallengeDetailsPage'),
    'ChallengeDetailsPage',
)

export const challengeDetailsChildRoutes = [
    {
        element: <ChallengeDetailsPage />,
        id: 'challenge-details-page',
        route: 'challenge-details',
    },
    ...reviewsRoutes,
]

export const challengeDetailsRoutes = [
    {
        authRequired: true,
        children: challengeDetailsChildRoutes,
        element: getRoutesContainer(challengeDetailsChildRoutes, ChallengeDetailContextProvider),
        id: challengeDetailRouteId,
        route: challengeDetailRouteId,
    },
]
