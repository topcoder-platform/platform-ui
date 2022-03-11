import { EnvironmentConfig } from '../../../../config'

export class ProfileEndpointConfigService {

    profile(handle: string): string {
        return `${EnvironmentConfig.API.V5}/members/${handle}`
    }
}
