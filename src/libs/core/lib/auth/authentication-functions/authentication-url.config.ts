import { AppSubdomain, EnvironmentConfig } from '~/config'

import { AuthenticationRegistrationSource } from './authentication-reg-source.enum'

export const authentication: string = EnvironmentConfig.AUTH.ACCOUNTS_APP_CONNECTOR

/**
 * Builds the Accounts login URL used by route guards and sign-in links, selecting
 * Wipro SSO only when Platform UI is served on the TopGear community host.
 *
 * @param returnUrl destination after login; defaults to the current URL without its query string.
 * @returns Accounts login URL with an encoded return destination and optional Wipro source.
 * @throws Does not throw.
 */
export function login(returnUrl?: string): string {
    const retUrl: string = returnUrl ?? window.location.href.match(/[^?]*/)?.[0] ?? window.location.host
    const communitySource: string = EnvironmentConfig.SUBDOMAIN === AppSubdomain.topgear ? '&utm_source=wipro' : ''
    return `${authentication}?retUrl=${encodeURIComponent(retUrl)}${communitySource}`
}

export const logoutFn = (retUrl: string): string => (
    `${authentication}?logout=true&retUrl=${encodeURIComponent(retUrl)}`
)

export const logout: string = logoutFn(`https://${window.location.host}`)

export function signup(returnUrl?: string, regSource?: AuthenticationRegistrationSource): string {
    return `${login(returnUrl)}&mode=signUp${!!regSource ? `&regSource=${regSource}` : ''}`
}
