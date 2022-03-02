import { EnvironmentConfig } from '../../../../config'

export class ProfileUrlConfig {

    profile(handle: string): string {
        return `${EnvironmentConfig.API.V5}/members/${handle}`
    }
}
