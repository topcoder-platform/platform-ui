import { AppSubdomain, EnvironmentConfig } from '~/config'

/** Canonical Opportunities listing route on every Platform UI host. */
export const OPPORTUNITIES_ROOT_ROUTE: string = '/opportunities'

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
