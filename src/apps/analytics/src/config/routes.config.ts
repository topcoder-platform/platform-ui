/** Route identifiers and builders for the Analytics application. */
import { AppSubdomain, EnvironmentConfig } from '~/config'

/**
 * Resolves the Analytics root for combined Platform UI and dedicated hosts.
 *
 * @param subdomain current hostname's leading label.
 * @returns empty dedicated-host root or `/analytics` on the combined host.
 * @throws Does not throw.
 */
export function getAnalyticsRootRoute(subdomain: string): string {
    return subdomain === AppSubdomain.analytics ? '' : `/${AppSubdomain.analytics}`
}

export const rootRoute = getAnalyticsRootRoute(EnvironmentConfig.SUBDOMAIN)
export const campaignsRouteId = 'campaigns'
export const generalRouteId = 'general'

/**
 * Builds an absolute in-app Analytics path for combined and dedicated hosts.
 *
 * @param segments URL-safe segments excluding the Analytics root.
 * @returns normalized path beginning with `/`.
 * @throws Does not throw.
 */
export function buildAnalyticsPath(...segments: string[]): string {
    const suffix = segments
        .filter(Boolean)
        .map(segment => encodeURIComponent(segment))
        .join('/')
    return `${rootRoute || ''}/${suffix}`.replace(/\/+/g, '/')
}
