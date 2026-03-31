/**
 * Common config for routes in QA app.
 */
import { AppSubdomain, EnvironmentConfig } from '~/config'

export const rootRoute: string
    = EnvironmentConfig.SUBDOMAIN === AppSubdomain.qa
        ? ''
        : `/${AppSubdomain.qa}`

export const qaHomeRouteId = 'home'
