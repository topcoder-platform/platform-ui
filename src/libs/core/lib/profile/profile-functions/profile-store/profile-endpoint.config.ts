import { EnvironmentConfig } from '~/config'

import { MemberSpecialRole } from '../../member-role-stats.model'

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
    // Fetch country list from lookups-api-v6; request a large page to get all
    return `${EnvironmentConfig.API.V6}/lookups/countries?page=1&perPage=9999`
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

/**
 * Builds the member API endpoint for copilot and reviewer summary statistics.
 *
 * This function does not throw.
 *
 * @param {string} handle - Member handle whose role statistics should be loaded.
 * @returns {string} Absolute member role statistics endpoint.
 */
export function memberRoleStatsURL(handle: string): string {
    return `${profile(handle)}/stats/roles`
}

/**
 * Builds the paginated member API endpoint for challenges associated with a special role.
 *
 * This function does not throw.
 *
 * @param {string} handle - Member handle whose role challenges should be loaded.
 * @param {MemberSpecialRole} role - Copilot or reviewer role to query.
 * @param {number} page - One-based page number.
 * @param {number} perPage - Number of challenges to request per page.
 * @returns {string} Absolute role challenge endpoint including pagination parameters.
 */
export function memberRoleChallengesURL(
    handle: string,
    role: MemberSpecialRole,
    page: number,
    perPage: number,
): string {
    return `${memberRoleStatsURL(handle)}/${role}/challenges?page=${page}&perPage=${perPage}`
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
