/**
 * Common config for routes in reports app.
 */
import { AppSubdomain, EnvironmentConfig } from '~/config'

/**
 * Resolves the Reports app root for the combined Platform UI and dedicated Reports host.
 *
 * @param subdomain Current host's leading subdomain.
 * @returns An empty dedicated-host root or `/reports` on the combined host.
 * @throws Does not throw.
 */
export function getReportsRootRoute(subdomain: string): string {
    return subdomain === AppSubdomain.reports
        ? ''
        : `/${AppSubdomain.reports}`
}

export const rootRoute: string = getReportsRootRoute(EnvironmentConfig.SUBDOMAIN)

export const reportsPageRouteId = 'reports'
export const dashboardsPageRouteId = 'dashboards'
export const dashboardDetailRoute = `${dashboardsPageRouteId}/:dashboardSlug`
export const bulkMemberLookupRouteId = 'bulk-member-lookup'
export const billingAccountsPageRouteId = 'sfdc-payments'
export const talentPageRouteId = 'talent'

export const dashboardRouteSlugs = {
    challengeParticipation: 'challenge-participation',
    membersPaid: 'members-paid',
    newSignups: 'new-signups',
} as const

/**
 * Builds an absolute Reports path that works on both combined and dedicated hosts.
 *
 * Each supplied segment is encoded independently, so callers should pass concrete
 * route values rather than slash-delimited paths or route templates.
 *
 * @param segments URL path segments following the Reports application root.
 * @returns A normalized absolute path beginning with `/`.
 * @throws Does not throw.
 */
export function buildReportsPath(...segments: string[]): string {
    const normalizedRoot = rootRoute.replace(/^\/+|\/+$/g, '')
    const suffix = segments
        .filter(Boolean)
        .map(segment => encodeURIComponent(segment))
        .join('/')
    const path = [normalizedRoot, suffix]
        .filter(Boolean)
        .join('/')

    return path ? `/${path}` : '/'
}
