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
    challengeDetailRouteId,
    rootRoute,
    scorecardRouteId,
} from './config/routes.config'

const ReviewApp: LazyLoadedComponent = lazyLoad(() => import('./ReviewApp'))

const ActiveReviewAssigments: LazyLoadedComponent = lazyLoad(
    () => import('./pages/active-review-assignements/ActiveReviewAssigments'),
)
const ChallengeDetailContainer: LazyLoadedComponent = lazyLoad(
    () => import('./pages/active-review-assignements/ChallengeDetailContainer'),
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

const ScorecardsContainer: LazyLoadedComponent = lazyLoad(
    () => import('./pages/scorecards/ScorecardsContainer'),
    'ScorecardsContainer',
)

const ScorecardsListPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/scorecards/ScorecardsListPage'),
    'ScorecardsListPage',
)

const ViewScorecardPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/scorecards/ViewScorecardPage'),
    'ViewScorecardPage',
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
                        children: [
                            {
                                element: <ChallengeDetailsPage />,
                                id: 'challenge-details-page',
                                route: 'challenge-details',
                            },
                            {
                                element: <ScorecardDetailsPage />,
                                id: 'scorecard-details-page',
                                route: 'scorecard-details/:scorecardId',
                            },

                        ],
                        element: <ChallengeDetailContainer />,
                        id: challengeDetailRouteId,
                        route: challengeDetailRouteId,
                    },
                ],
                element: <ActiveReviewAssigments />,
                id: activeReviewAssigmentsRouteId,
                route: activeReviewAssigmentsRouteId,
            },
            {
                children: [
                    {
                        element: <ScorecardsListPage />,
                        id: 'list-scorecards-page',
                        route: '',
                    },
                    {
                        element: <ViewScorecardPage />,
                        id: 'view-scorecard-page',
                        route: ':scorecardId',
                    },

                ],
                element: <ScorecardsContainer />,
                id: scorecardRouteId,
                route: scorecardRouteId,
            },
        ],
        domain: AppSubdomain.review,
        element: <ReviewApp />,
        id: toolTitle,
        route: rootRoute,
        title: toolTitle,
    },
]
