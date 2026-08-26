/**
 * Access rules for the operator-only submission duplicate detection endpoint.
 */

/**
 * Challenge resource role fragments the duplicates endpoint accepts.
 * Mirrors the review API's `DUPLICATE_DETECTION_RESOURCE_ROLE_FRAGMENTS`.
 */
const DUPLICATE_CHALLENGE_ROLE_FRAGMENTS = [
    'copilot',
    'manager',
    'reviewer',
    'screener',
]

/** Token roles the duplicates endpoint accepts without a challenge resource. */
const DUPLICATE_TOKEN_ROLES = [
    'administrator',
    'project manager',
]

function normalizeRoles(roles: Array<string | undefined> | undefined): string[] {
    return (roles ?? [])
        .map(role => `${role ?? ''}`.trim()
            .toLowerCase())
        .filter(Boolean)
}

/**
 * Determines whether the current user may query submission duplicates.
 *
 * The endpoint answers only for admins, PMs, and challenge
 * Reviewer/Screener/Copilot/Manager resources, so the UI must not call it for
 * anyone else — a submitter would only collect a 403.
 *
 * @param challengeRoles Resource role names the user holds on the challenge.
 * @param tokenRoles Roles carried by the auth token.
 * @returns True when the duplicates endpoint will answer for this user.
 */
export function canViewSubmissionDuplicates(
    challengeRoles: string[] | undefined,
    tokenRoles: Array<string | undefined> | undefined,
): boolean {
    const normalizedTokenRoles = normalizeRoles(tokenRoles)
    if (normalizedTokenRoles.some(role => DUPLICATE_TOKEN_ROLES.includes(role))) {
        return true
    }

    const normalizedChallengeRoles = normalizeRoles(challengeRoles)

    return normalizedChallengeRoles.some(
        role => DUPLICATE_CHALLENGE_ROLE_FRAGMENTS.some(fragment => role.includes(fragment)),
    )
}
