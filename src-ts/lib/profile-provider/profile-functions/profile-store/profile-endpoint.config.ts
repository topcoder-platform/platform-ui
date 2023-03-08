import { EnvironmentConfig } from '../../../../config'

export function profile(handle: string): string {
    return `${EnvironmentConfig.API.V5}/members/${handle}`
}

export function verify(): string {
    return `${EnvironmentConfig.API.V4}/looks/${EnvironmentConfig.MEMBER_VERIFY_LOOKER}/run/json`
}
