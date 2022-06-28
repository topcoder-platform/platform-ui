import { EnvironmentConfig } from '../../../config'

export const authentication: string = EnvironmentConfig.URL.ACCOUNTS_APP_CONNECTOR

export function login(fallback: string): string {
    return `${authentication}?retUrl=${encodeURIComponent(window.location.href.match(/[^?]*/)?.[0] || fallback)}`
}

export function logout(loggedOutRoute: string): string {
    return `${authentication}?logout=true&retUrl=${encodeURIComponent('https://' + window.location.host)}${loggedOutRoute}`
}

export function signup(fallback: string): string {
    return `${login(fallback)}&regSource=tcBusiness&mode=signUp`
}
