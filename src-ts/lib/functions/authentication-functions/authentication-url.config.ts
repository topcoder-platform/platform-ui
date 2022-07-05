import { EnvironmentConfig } from '../../../config'

export const authentication: string = EnvironmentConfig.URL.ACCOUNTS_APP_CONNECTOR

export const login: string = `${authentication}?retUrl=${encodeURIComponent(window.location.href.match(/[^?]*/)?.[0] || window.location.host)}`

export function logout(loggedOutRoute: string): string {
    return `${authentication}?logout=true&retUrl=${encodeURIComponent('https://' + window.location.host)}${loggedOutRoute}`
}

export function signup(): string {
    return `${login}&regSource=tcBusiness&mode=signUp`
}
