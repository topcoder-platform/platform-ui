import { EnvironmentConfig } from '../../../config'

import { AuthenticationRegistrationSource } from './authentication-reg-source.enum'

export const authentication: string = EnvironmentConfig.URL.ACCOUNTS_APP_CONNECTOR

export function login(returnUrl?: string): string {
    const retUrl: string = returnUrl ?? window.location.href.match(/[^?]*/)?.[0] ?? window.location.host
    return `${authentication}?retUrl=${encodeURIComponent(retUrl)}`
}

export const logout: string = `${authentication}?logout=true&retUrl=${encodeURIComponent('https://' + window.location.host)}`

export function signup(returnUrl?: string, regSource?: AuthenticationRegistrationSource): string {
    return `${login(returnUrl)}&mode=signUp${!!regSource ? `&regSource=${regSource}` : ''}`
}
