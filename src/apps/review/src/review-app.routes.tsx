/**
 * App routes
 */
import { AppSubdomain, ToolTitle } from '~/config'
import {
    lazyLoad,
    LazyLoadedComponent,
    PlatformRoute,
    Rewrite,
} from '~/libs/core'

import {
    activeReviewAssigmentsRouteId,
    rootRoute,
} from './config/routes.config'

const ReviewApp: LazyLoadedComponent = lazyLoad(() => import('./ReviewApp'))

const ActiveReviewAssigments: LazyLoadedComponent = lazyLoad(
    () => import('./pages/active-review-assignements/ActiveReviewAssigments'),
)
const ActiveReviewsPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/active-review-assignements/ActiveReviewsPage'),
    'ActiveReviewsPage',
)
const ChallengeDetailsPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/active-review-assignements/ChallengeDetailsPage'),
    'ChallengeDetailsPage',
)
const ScorecardDetailsPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/active-review-assignements/ScorecardDetailsPage'),
    'ScorecardDetailsPage',
)

export const toolTitle: string = ToolTitle.review

export const reviewRoutes: ReadonlyArray<PlatformRoute> = [
    // Review App Root
    {
        authRequired: true,
        children: [
            {
                element: <Rewrite to={activeReviewAssigmentsRouteId} />,
                route: '',
            },
            // Active Review Assigments Module
            {
                children: [
                    {
                        element: <ActiveReviewsPage />,
                        id: 'active-reviews-page',
                        route: '',
                    },
                    {
                        element: <ChallengeDetailsPage />,
                        id: 'challenge-details-page',
                        route: ':challengeId/challenge-details',
                    },
                    {
                        element: <ScorecardDetailsPage />,
                        id: 'scorecard-details-page',
                        route: ':challengeId/scorecard-details/:scorecardId',
                    },
                ],
                element: <ActiveReviewAssigments />,
                id: activeReviewAssigmentsRouteId,
                route: activeReviewAssigmentsRouteId,
            },
        ],
        domain: AppSubdomain.review,
        element: <ReviewApp />,
        id: toolTitle,
        route: rootRoute,
        title: toolTitle,
    },
]
