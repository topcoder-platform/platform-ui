import { EnvironmentConfig } from '../../../../config'

export class ProfileEndpointConfig {

    profile(handle: string): string {
        return `${EnvironmentConfig.API.V5}/members/${handle}`
    }
}
