import { EnvironmentConfig } from '../config'

export class ExternalEndpoint {

    readonly authentication: string = EnvironmentConfig.URL.ACCOUNTS_APP_CONNECTOR

    login(fallback: string): string {
        // TODO: environment config
        return `https://accounts-auth0.topcoder-dev.com?retUrl=${encodeURIComponent(window.location.href.match(/[^?]*/)?.[0] || fallback)}`
    }

    signup(fallback: string): string {
        return `${this.login(fallback)}&regSource=tcBusiness&mode=signUp`
    }
}
