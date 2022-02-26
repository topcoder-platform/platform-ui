import { EnvironmentConfig } from '../config'

export class ExternalEndpoint {

    readonly authentication: string = EnvironmentConfig.URL.ACCOUNTS_APP_CONNECTOR
}
