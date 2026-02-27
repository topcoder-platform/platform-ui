import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

import {
    type BackendCommunityMeta,
    type CommunityMeta,
    convertBackendCommunityMeta,
} from '../models'

const communityBaseUrl = `${EnvironmentConfig.API.V6}`

/**
 * Fetches all communities.
 *
 * @returns List of converted community metadata entries.
 */
export const fetchCommunities = async (): Promise<CommunityMeta[]> => {
    const communities = await xhrGetAsync<BackendCommunityMeta[]>(
        `${communityBaseUrl}/communities`,
    )

    return communities.map(convertBackendCommunityMeta)
}

/**
 * Fetches metadata for a single community.
 *
 * @param communityId Community identifier.
 * @returns Converted community metadata.
 */
export const fetchCommunityMeta = async (
    communityId: string,
): Promise<CommunityMeta> => {
    const result = await xhrGetAsync<BackendCommunityMeta>(
        `${communityBaseUrl}/communities/${communityId}/meta`,
    )

    return convertBackendCommunityMeta(result)
}
