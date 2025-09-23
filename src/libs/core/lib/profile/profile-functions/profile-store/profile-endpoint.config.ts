import { EnvironmentConfig } from '~/config'

export function profile(handle: string): string {
    return `${EnvironmentConfig.API.V6}/members/${handle}`
}

export function verify(): string {
    // No DEV Looker API exists thus we hardcode the URL here
    // to use always prod reporting API regardless of environment.
    // There is a mock DEV look in Looker with id: 3964 that is used for dev/QA purposes
    return `https://api.topcoder.com/v4/looks/${EnvironmentConfig.MEMBER_VERIFY_LOOKER}/run/json`
}

export function countryLookupURL(): string {
    // API URL is hardcoded here because there is no DEV API for this endpoint
    // TODO: add DEV API eventually and/or add a config for this
    return `${EnvironmentConfig.API.V6}/members/lookup/countries`
}

export function gamificationAPIBaseURL(): string {
    return `${EnvironmentConfig.API.V5}/gamification`
}

export function learnBaseURL(): string {
    return `${EnvironmentConfig.API.V5}/learning-paths`
}

export function memberStatsDistroURL(): string {
    return `${EnvironmentConfig.API.V6}/members/stats/distribution`
}

export function memberModifyURL(): string {
    return `${EnvironmentConfig.API.V6}/users`
}

export function memberEmailPreferencesURL(): string {
    // TODO: this is a API under community-app, we should move it to a new API.
    // Also, note the audience id is hardcoded here NO DEV audience exists in Mailchimp
    return `https://community-app.${EnvironmentConfig.TC_DOMAIN}/api/mailchimp/28bfd3c062/members`
}

export function userSkillsUrl(userIdOrAction: string): string {
    return `${EnvironmentConfig.API.V5}/standardized-skills/user-skills/${userIdOrAction}`
}
