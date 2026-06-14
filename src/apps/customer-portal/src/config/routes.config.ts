/**
 * Common config for routes in Customer Portal app.
 */
import { AppSubdomain, EnvironmentConfig } from '~/config'

export const rootRoute: string
    = EnvironmentConfig.SUBDOMAIN === AppSubdomain.customer
        ? ''
        : `/${AppSubdomain.customer}`

export const talentSearchRouteId = 'talent-search'
