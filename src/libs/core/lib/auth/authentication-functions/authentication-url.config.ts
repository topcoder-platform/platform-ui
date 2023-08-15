import { EnvironmentConfig } from '~/config'

import { AuthenticationRegistrationSource } from './authentication-reg-source.enum'

export const authentication: string = EnvironmentConfig.AUTH.ACCOUNTS_APP_CONNECTOR

export function login(returnUrl?: string): string {
    const retUrl: string = returnUrl ?? window.location.href.match(/[^?]*/)?.[0] ?? window.location.host
    return `${authentication}?retUrl=${encodeURIComponent(retUrl)}`
}

export const logoutFn = (retUrl: string): string => (
    `${authentication}?logout=true&retUrl=${encodeURIComponent(retUrl)}`
)

export const logout: string = logoutFn(`https://${window.location.host}`)

export function signup(returnUrl?: string, regSource?: AuthenticationRegistrationSource): string {
    return `${login(returnUrl)}&mode=signUp${!!regSource ? `&regSource=${regSource}` : ''}`
}
