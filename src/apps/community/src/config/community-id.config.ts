/**
 * Community ids with explicit `__community__/{communityId}` route wiring.
 */
export const explicitCommunityIds = [
    'wipro',
    'veterans',
    'qa',
    'mobile',
    'iot',
    'cognitive',
    'blockchain',
    'cs',
    'demoexpert',
    'srmx',
    'taskforce',
    'tcproddev',
    'community2',
] as const

export type ExplicitCommunityId = (typeof explicitCommunityIds)[number]

const explicitCommunityIdSet: ReadonlySet<string> = new Set(explicitCommunityIds)

/**
 * Resolves a routed community id from a browser host value.
 *
 * @param host Browser `location.host` value.
 * @returns Community id when the host subdomain matches a routed community.
 */
export function resolveCommunityIdFromHost(host: string): ExplicitCommunityId | undefined {
    const hostname = host
        .toLowerCase()
        .split(':')[0]
    const subdomain = hostname.split('.')[0]

    if (!subdomain || !explicitCommunityIdSet.has(subdomain)) {
        return undefined
    }

    return subdomain as ExplicitCommunityId
}
