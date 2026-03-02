import { useCallback } from 'react'
import useSWR, { SWRResponse } from 'swr'

import { CommunityMeta } from '../models'
import { fetchCommunityMeta } from '../services'

export interface UseCommunityMetaResult {
    communityMeta: CommunityMeta | undefined
    isLoading: boolean
}

/**
 * Fetches metadata for a selected community.
 *
 * @param communityId Optional community id.
 * @returns Community metadata and loading status.
 */
export function useCommunityMeta(communityId?: string): UseCommunityMetaResult {
    const fetcher = useCallback(
        () => fetchCommunityMeta(communityId ?? ''),
        [communityId],
    )
    const {
        data: communityMeta,
        isValidating: isLoading,
    }: SWRResponse<CommunityMeta, Error> = useSWR<CommunityMeta, Error>(
        communityId
            ? `community/meta/${communityId}`
            : undefined,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        },
    )

    return {
        communityMeta,
        isLoading: Boolean(communityId) && !communityMeta && isLoading,
    }
}
