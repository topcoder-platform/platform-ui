/** Domain-aware routes for the Support application. */
import { AppSubdomain, EnvironmentConfig } from '~/config'

export const closedRouteId = 'closed'
export const ticketRouteId = 'tickets/:ticketId'

/**
 * Resolves the Support root for combined and dedicated hosts.
 *
 * @param subdomain current host's leading subdomain.
 * @returns an empty dedicated-host root or `/support` on the combined host.
 * @throws Does not throw.
 */
export function getSupportRootRoute(subdomain: string): string {
    return subdomain.toLowerCase() === AppSubdomain.support.toLowerCase()
        ? ''
        : `/${AppSubdomain.support}`
}

export const rootRoute: string = getSupportRootRoute(EnvironmentConfig.SUBDOMAIN)

/**
 * Builds an absolute Support path and safely encodes every opaque segment.
 *
 * @param segments path segments below the Support root.
 * @returns a normalized absolute path.
 * @throws Does not throw.
 */
export function buildSupportPath(...segments: string[]): string {
    const suffix = segments
        .filter(Boolean)
        .map(segment => encodeURIComponent(segment))
        .join('/')

    return `${rootRoute || ''}/${suffix}`.replace(/\/+/g, '/')
}
