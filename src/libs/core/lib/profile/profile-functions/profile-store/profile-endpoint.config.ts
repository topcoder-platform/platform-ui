import { EnvironmentConfig } from '~/config'

export function profile(handle: string): string {
    return `${EnvironmentConfig.API.V5}/members/${handle}`
}

export function verify(): string {
    return `${EnvironmentConfig.API.V4}/looks/${EnvironmentConfig.MEMBER_VERIFY_LOOKER}/run/json`
}

export function countryLookupURL(): string {
    // API URL is hardcoded here because there is no DEV API for this endpoint
    // TODO: add DEV API eventually and/or add a config for this
    return 'https://api.topcoder.com/v3/members/lookup/countries'
}

export function gamificationAPIBaseURL(): string {
    return `${EnvironmentConfig.API.V5}/gamification`
}
