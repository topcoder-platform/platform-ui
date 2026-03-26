/**
 * Common config for routes in reports app.
 */
import { AppSubdomain, EnvironmentConfig } from '~/config'

export const rootRoute: string
    = EnvironmentConfig.SUBDOMAIN === AppSubdomain.reports
        ? ''
        : `/${AppSubdomain.reports}`

export const reportsPageRouteId = 'reports'
export const bulkMemberLookupRouteId = 'bulk-member-lookup'
