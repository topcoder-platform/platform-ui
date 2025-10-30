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
    activeReviewAssignmentsRouteId,
    rootRoute,
} from './config/routes.config'
import { scorecardRoutes } from './pages/scorecards'
import { aiScorecardRoutes } from './pages/ai-scorecards'
import { activeReviewRoutes } from './pages/active-review-assignements'
import { pastReviewRoutes } from './pages/past-review-assignments'

const ReviewApp: LazyLoadedComponent = lazyLoad(() => import('./ReviewApp'))

const activeChallengeDetailsRewriteTarget: string
    = `${rootRoute || ''}/${activeReviewAssignmentsRouteId}/:challengeId/challenge-details`

export const toolTitle: string = ToolTitle.review

export const reviewRoutes: ReadonlyArray<PlatformRoute> = [
    // Review App Root
    {
        children: [
            {
                authRequired: true,
                element: <Rewrite to={activeReviewAssignmentsRouteId} />,
                route: '',
            },
            // Legacy redirect: /review/challenges/:challengeId
            // -> /review/active-challenges/:challengeId/challenge-details
            {
                authRequired: true,
                element: (
                    <Rewrite
                        to={activeChallengeDetailsRewriteTarget}
                    />
                ),
                route: 'challenges/:challengeId',
            },
            // Shortcut: /review/:challengeId
            // -> /review/active-challenges/:challengeId/challenge-details
            {
                authRequired: true,
                element: (
                    <Rewrite
                        to={activeChallengeDetailsRewriteTarget}
                    />
                ),
                route: ':challengeId',
            },
            // Active Challenges Module
            ...activeReviewRoutes,
            // Past Challenges Module
            ...pastReviewRoutes,
            ...scorecardRoutes,
            ...aiScorecardRoutes,
        ],
        domain: AppSubdomain.review,
        element: <ReviewApp />,
        id: toolTitle,
        route: rootRoute,
        title: toolTitle,
    },
]
