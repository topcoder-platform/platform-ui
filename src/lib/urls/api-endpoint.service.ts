import { EnvironmentConfig } from '../config'

export class ApiEndoint {

    profile(handle: string): string {
        return `${EnvironmentConfig.API.V5}/members/${handle}`
    }
}
