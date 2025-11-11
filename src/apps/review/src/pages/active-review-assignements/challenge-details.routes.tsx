import { getRoutesContainer, lazyLoad, LazyLoadedComponent } from '~/libs/core'

import { challengeDetailRouteId } from '../../config/routes.config'
import { reviewsRoutes } from '../reviews'

const ChallengeDetailContextProvider: LazyLoadedComponent = lazyLoad(
    () => import('../../lib/contexts/ChallengeDetailContextProvider'),
    'ChallengeDetailContextProvider',
)
const ScorecardDetailsPage: LazyLoadedComponent = lazyLoad(
    () => import('./ScorecardDetailsPage'),
    'ScorecardDetailsPage',
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
    {
        element: <ScorecardDetailsPage />,
        id: 'scorecard-details-page',
        route: 'review/:reviewId',
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
