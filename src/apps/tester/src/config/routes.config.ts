/**
 * Common config for routes in tester app.
 */
import { AppSubdomain, EnvironmentConfig } from '~/config'

export const rootRoute: string
    = EnvironmentConfig.SUBDOMAIN === AppSubdomain.tester
        ? ''
        : `/${AppSubdomain.tester}`

export const flowsRouteId = 'flows'
