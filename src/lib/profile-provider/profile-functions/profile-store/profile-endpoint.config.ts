import { EnvironmentConfig } from '../../../../config'

export function profile(handle: string): string {
    return `${EnvironmentConfig.API.V5}/members/${handle}`
}
