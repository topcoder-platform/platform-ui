import type {
    BackendChallengeFilter,
    BackendCommunityMeta,
    BackendLogo,
    BackendMenuItem,
} from './BackendCommunityMeta.model'

/**
 * Normalized community metadata used by the community frontend.
 */
export interface CommunityMeta {
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

/**
 * Converts backend community metadata into the frontend model.
 *
 * @param data Raw backend community metadata.
 * @returns Frontend community metadata.
 */
export function convertBackendCommunityMeta(
    data: BackendCommunityMeta,
): CommunityMeta {
    return {
        ...data,
    }
}
