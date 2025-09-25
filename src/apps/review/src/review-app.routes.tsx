/**
 * App routes
 */
import { AppSubdomain, ToolTitle } from '~/config'
import {
    lazyLoad,
    LazyLoadedComponent,
    PlatformRoute,
    Rewrite,
    UserRole,
} from '~/libs/core'

import {
    activeReviewAssigmentsRouteId,
    challengeDetailRouteId,
    pastChallengeDetailContainerRouteId,
    pastReviewAssignmentsRouteId,
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
const PastReviewAssignments: LazyLoadedComponent = lazyLoad(
    () => import('./pages/past-review-assignments/PastReviewAssignments'),
)
const PastReviewsPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/past-review-assignments/PastReviewsPage'),
    'PastReviewsPage',
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
const EditScorecardPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/scorecards/EditScorecardPage'),
    'EditScorecardPage',
)

export const toolTitle: string = ToolTitle.review

export const reviewRoutes: ReadonlyArray<PlatformRoute> = [
    // Review App Root
    {
        children: [
            {
                authRequired: true,
                element: <Rewrite to={activeReviewAssigmentsRouteId} />,
                route: '',
            },
            // Active Review Assigments Module
            {
                children: [
                    {
                        authRequired: true,
                        element: <ActiveReviewsPage />,
                        id: 'active-reviews-page',
                        route: '',
                    },
                    {
                        authRequired: true,
                        children: [
                            {
                                element: <ChallengeDetailsPage />,
                                id: 'challenge-details-page',
                                route: 'challenge-details',
                            },
                            {
                                element: <ScorecardDetailsPage />,
                                id: 'scorecard-details-page',
                                route: 'scorecard-details/:submissionId/review/:resourceId',
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
            // Past Review Assignments Module
            {
                children: [
                    {
                        authRequired: true,
                        element: <PastReviewsPage />,
                        id: 'past-reviews-page',
                        route: '',
                    },
                    {
                        authRequired: true,
                        children: [
                            {
                                element: <ChallengeDetailsPage />,
                                id: 'past-challenge-details-page',
                                route: 'challenge-details',
                            },
                            {
                                element: <ScorecardDetailsPage />,
                                id: 'past-scorecard-details-page',
                                route: 'scorecard-details/:submissionId/review/:resourceId',
                            },
                        ],
                        element: (
                            <ChallengeDetailContainer
                                parentRouteId={pastReviewAssignmentsRouteId}
                                detailRouteId={pastChallengeDetailContainerRouteId}
                            />
                        ),
                        id: pastChallengeDetailContainerRouteId,
                        route: challengeDetailRouteId,
                    },
                ],
                element: <PastReviewAssignments />,
                id: pastReviewAssignmentsRouteId,
                route: pastReviewAssignmentsRouteId,
            },
            {
                children: [
                    {
                        authRequired: true,
                        element: <ScorecardsListPage />,
                        id: 'list-scorecards-page',
                        rolesRequired: [UserRole.administrator],
                        route: '',
                    },
                    {
                        authRequired: true,
                        element: <EditScorecardPage />,
                        id: 'edit-scorecard-page',
                        rolesRequired: [
                            UserRole.administrator,
                        ],
                        route: ':scorecardId/edit',
                    },
                    {
                        authRequired: true,
                        element: <EditScorecardPage />,
                        id: 'new-scorecard-page',
                        rolesRequired: [
                            UserRole.administrator,
                        ],
                        route: 'new',
                    },
                    {
                        authRequired: false,
                        element: <ViewScorecardPage />,
                        id: 'view-scorecard-page',
                        route: ':scorecardId',
                    },

                ],
                element: <ScorecardsContainer />,
                id: scorecardRouteId,
                rolesRequired: [
                    UserRole.administrator,
                ],
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
