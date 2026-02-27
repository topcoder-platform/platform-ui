/**
 * Raw menu item as returned by groups-api-v6 community metadata endpoints.
 */
export interface BackendMenuItem {
    [key: string]: unknown
}

/**
 * Raw logo item as returned by groups-api-v6 community metadata endpoints.
 */
export interface BackendLogo {
    [key: string]: unknown
}

/**
 * Raw challenge filter metadata returned for a community.
 */
export interface BackendChallengeFilter {
    groupIds: string[]
    tags?: string[]
}

/**
 * Raw community metadata from `GET /communities/:communityId/meta`.
 */
export interface BackendCommunityMeta {
    authorizedGroupIds: string[]
    challengeFilter: BackendChallengeFilter
    communityId: string
    communityName: string
    description: string
    groupIds: string[]
    hidden: boolean
    logos: BackendLogo[]
    mainSubdomain?: string
    menuItems: BackendMenuItem[]
    metadata: Record<string, unknown>
    subdomains: string[]
    terms: string[]
}
