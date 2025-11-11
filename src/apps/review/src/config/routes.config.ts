/**
 * Common config for routes in review app.
 */
import { AppSubdomain, EnvironmentConfig } from '~/config'

export const rootRoute: string
    = EnvironmentConfig.SUBDOMAIN === AppSubdomain.review
        ? ''
        : `/${AppSubdomain.review}`

export const activeReviewAssignmentsRouteId = 'active-challenges'
export const openOpportunitiesRouteId = 'open-opportunities'
export const pastReviewAssignmentsRouteId = 'past-challenges'
export const challengeDetailRouteId = ':challengeId'
export const scorecardRouteId = 'scorecard'
export const aiScorecardRouteId = 'scorecard'
export const viewScorecardRouteId = ':scorecardId'
