/**
 * Challenges service
 */
import {
    PaginatedResponse,
    xhrGetAsync,
    xhrGetPaginatedAsync,
} from '~/libs/core'
import { EnvironmentConfig } from '~/config'

import {
    BackendChallengeInfo,
    BackendChallengeTrack,
    BackendChallengeType,
    ChallengeInfo,
    convertBackendChallengeInfo,
} from '../models'

const challengeBaseUrl = `${EnvironmentConfig.API.V6}`

/**
 * Fetch challenge info by id
 * @param id challenge id
 * @returns resolves to the challenge info
 */
export const fetchChallengeInfoById = async (id: string): Promise<ChallengeInfo> => {
    const result = await xhrGetAsync<BackendChallengeInfo>(
        `${challengeBaseUrl}/challenges/${id}`,
    )
    return convertBackendChallengeInfo(result) as ChallengeInfo
}

/**
 * Fetch all challenge type.
 * @returns resolves to the list of challenge type
 */
export const fetchChallengeTypes = async (): Promise<
    PaginatedResponse<BackendChallengeType[]>
> => xhrGetPaginatedAsync<BackendChallengeType[]>(
    `${challengeBaseUrl}/challenge-types`,
)

/**
 * Fetch all challenge track.
 * @returns resolves to the list of challenge track
 */
export const fetchChallengeTracks = async (): Promise<
    PaginatedResponse<BackendChallengeTrack[]>
> => xhrGetPaginatedAsync<BackendChallengeTrack[]>(
    `${challengeBaseUrl}/challenge-tracks`,
)
