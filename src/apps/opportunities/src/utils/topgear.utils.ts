import { AppSubdomain, EnvironmentConfig } from '~/config'

import { ChallengeOpportunity } from '../models'

/** Canonical challenge listing route on the Topgear community hosts. */
export const TOPGEAR_CHALLENGES_ROUTE: string = '/opportunities/challenge'

/**
 * Checks whether Platform UI is served on the TopGear community host
 * (`topgear.<environment domain>`), which replaces community-app's Wipro
 * community. TopGear members only browse competitions, so the host hides the
 * other opportunity categories and lists the community group's challenges.
 *
 * @returns true on the TopGear host.
 * @throws Does not throw.
 */
export function isTopgearCommunity(): boolean {
    return EnvironmentConfig.SUBDOMAIN === AppSubdomain.topgear
}

/**
 * Lists the Topcoder groups whose challenges make up the TopGear listing.
 *
 * @returns configured TopGear group IDs, omitting blank configuration.
 * @throws Does not throw.
 */
export function topgearGroupIds(): string[] {
    const groupId: string = String(EnvironmentConfig.TOPGEAR?.GROUP_ID ?? '')
        .trim()
    return groupId ? [groupId] : []
}

/**
 * Resolves the TopGear challenge terms page that community-app's Wipro
 * community linked as "TopGear Challenges Explained". The challenge rail shows
 * it in place of the Topcoder Thrive article for TopGear challenges.
 *
 * @returns configured `URLS.TOPGEAR_TERMS`, or an empty string when unset.
 * @throws Does not throw.
 */
export function topgearTermsUrl(): string {
    return String(EnvironmentConfig.URLS?.TOPGEAR_TERMS ?? '')
        .trim()
}

/**
 * Checks whether a challenge belongs to the TopGear (Wipro) community, mirroring
 * community-app's `isWipro` check on the challenge page. A challenge is TopGear
 * when Platform UI is served on the TopGear host or when the challenge sits in
 * a configured TopGear group. The challenge rail uses this to replace Topcoder
 * guidance (Review App, Thrive articles, Usable Code Rules) with the TopGear
 * challenge terms.
 *
 * @param challenge challenge whose `groups` are compared against the TopGear group.
 * @returns true for TopGear challenges.
 * @throws Does not throw.
 */
export function isTopgearChallenge(challenge: Pick<ChallengeOpportunity, 'groups'>): boolean {
    if (isTopgearCommunity()) {
        return true
    }

    const groupIds: string[] = topgearGroupIds()
    return (challenge.groups ?? []).some(group => groupIds.includes(group))
}
