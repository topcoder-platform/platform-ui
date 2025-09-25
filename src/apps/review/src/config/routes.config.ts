/**
 * Common config for routes in review app.
 */
import { AppSubdomain, EnvironmentConfig } from '~/config'

export const rootRoute: string
    = EnvironmentConfig.SUBDOMAIN === AppSubdomain.review
        ? ''
        : `/${AppSubdomain.review}`

export const activeReviewAssigmentsRouteId = 'active-review-assigments'
export const openOpportunitiesRouteId = 'open-opportunities'
export const pastReviewAssignmentsRouteId = 'past-review-assignments'
export const challengeDetailRouteId = ':challengeId'
export const pastChallengeDetailContainerRouteId = 'past-challenge-details'
export const scorecardRouteId = 'scorecard'
export const viewScorecardRouteId = ':scorecardId'
