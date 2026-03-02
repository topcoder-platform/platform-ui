/**
 * Common config for routes in community app.
 */
import { AppSubdomain, EnvironmentConfig } from '~/config'

export const rootRoute: string
    = EnvironmentConfig.SUBDOMAIN === AppSubdomain.community
        ? ''
        : '/community'

export const challengeListingRouteId = 'challenges'
export const challengeDetailRouteId = 'challenges/:challengeId'
export const submissionRouteId = 'challenges/:challengeId/submit'
export const submissionManagementRouteId = 'challenges/:challengeId/my-submissions'
export const homeRouteId = 'home'
export const thriveListingRouteId = 'thrive'
export const thriveTracksRouteId = 'thrive/tracks'
export const thriveSearchRouteId = 'thrive/search'
export const thriveArticleRouteId = 'thrive/:articleTitle'
export const changelogRouteId = 'changelog'
export const timelineWallRouteId = 'timeline-wall'
export const communityLoaderRouteId = '__community__'
