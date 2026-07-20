/**
 * Route identifiers and builders for the Status application.
 */
import { AppSubdomain, EnvironmentConfig } from '~/config'

/**
 * Resolves the Status app root for combined Platform UI and dedicated hosts.
 *
 * @param subdomain current host's leading subdomain.
 * @returns an empty dedicated-host root or `/status` on the combined host.
 * @throws Does not throw.
 */
export function getStatusRootRoute(subdomain: string): string {
    return subdomain === AppSubdomain.status
        ? ''
        : `/${AppSubdomain.status}`
}

export const rootRoute: string = getStatusRootRoute(EnvironmentConfig.SUBDOMAIN)

export const ecsRouteId = 'ecs'
export const apiRouteId = 'api'
export const sendgridRouteId = 'sendgrid'
export const databaseRouteId = 'database'

/**
 * Builds an absolute in-app Status path for combined and dedicated hosts.
 *
 * @param segments URL-safe path segments, excluding the Status root.
 * @returns a normalized path beginning with `/`.
 * @throws Does not throw.
 */
export function buildStatusPath(...segments: string[]): string {
    const suffix = segments
        .filter(Boolean)
        .map(segment => encodeURIComponent(segment))
        .join('/')
    const root = rootRoute || ''

    return `${root}/${suffix}`.replace(/\/+/g, '/')
}
