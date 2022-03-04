import { EnvironmentConfig } from '../../../config'

export class AuthenticationUrlConfig {

    readonly authentication: string = EnvironmentConfig.URL.ACCOUNTS_APP_CONNECTOR

    get logout(): string {
        return `${this.authentication}?logout=true&retUrl=${encodeURIComponent('https://' + window.location.host)}`
    }

    login(fallback: string): string {
        return `${this.authentication}?retUrl=${encodeURIComponent(window.location.href.match(/[^?]*/)?.[0] || fallback)}`
    }

    signup(fallback: string): string {
        return `${this.login(fallback)}&regSource=tcBusiness&mode=signUp`
    }
}
