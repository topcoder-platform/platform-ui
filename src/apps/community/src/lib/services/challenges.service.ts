import qs from 'qs'

import { EnvironmentConfig } from '~/config'
import {
    type PaginatedResponse,
    xhrDeleteAsync,
    xhrGetAsync,
    xhrGetPaginatedAsync,
    xhrPostAsync,
} from '~/libs/core'

import { SUBMITTER_ROLE_ID } from '../../config/index.config'
import {
    type BackendChallengeInfo,
    type BackendRegistrant,
    type ChallengeInfo,
    convertBackendChallengeInfo,
} from '../models'

/**
 * Query params for community challenge listing.
 */
export interface ChallengeListParams {
    /**
     * Active phase filter, e.g. `Registration`.
     */
    currentPhaseName?: string
    groups?: string[]
    /**
     * Current member id for "My Challenges" filters.
     */
    memberId?: string
    page?: number
    perPage?: number
    /**
     * Upper date boundary for registration start date.
     */
    registrationStartDateEnd?: string
    sortBy?: string
    sortOrder?: string
    status?: string
    tags?: string[]
}

/**
 * Raw challenge resource returned by the resources endpoint.
 */
export interface BackendResource {
    challengeId: string
    id: string
    memberHandle?: string
    memberId: string
    roleId: string
}

interface BackendRegistrantResource {
    countryCode?: string
    countryFlag?: string
    countryInfo?: {
        countryCode?: string
        countryFlag?: string
    }
    created?: string
    createdAt?: string
    memberHandle?: string
    submissionDate?: string
    submissionTime?: string
    rating?: number
    userHandle?: string
}

const challengeBaseUrl = `${EnvironmentConfig.API.V6}`

/**
 * Fetches community challenges with optional filters.
 *
 * @param params Challenge list filters.
 * @returns Paginated backend challenge payload.
 */
export const fetchChallenges = async (
    params: ChallengeListParams,
): Promise<PaginatedResponse<BackendChallengeInfo[]>> => {
    const query = qs.stringify(params, {
        arrayFormat: 'repeat',
        skipNulls: true,
    })
    const endpoint = query
        ? `${challengeBaseUrl}/challenges?${query}`
        : `${challengeBaseUrl}/challenges`

    return xhrGetPaginatedAsync<BackendChallengeInfo[]>(endpoint)
}

/**
 * Fetches challenge details by id.
 *
 * @param id Challenge identifier.
 * @returns Converted challenge info.
 */
export const fetchChallengeById = async (id: string): Promise<ChallengeInfo> => {
    const result = await xhrGetAsync<BackendChallengeInfo>(
        `${challengeBaseUrl}/challenges/${id}`,
    )

    return convertBackendChallengeInfo(result) as ChallengeInfo
}

/**
 * Registers the current member as challenge submitter.
 *
 * @param challengeId Challenge identifier.
 */
export const registerForChallenge = async (challengeId: string): Promise<void> => {
    await xhrPostAsync<{ challengeId: string; roleId: string }, BackendResource>(
        `${challengeBaseUrl}/resources`,
        {
            challengeId,
            roleId: SUBMITTER_ROLE_ID,
        },
    )
}

/**
 * Unregisters the current member from challenge resources.
 *
 * @param resourceId Resource identifier to remove.
 */
export const unregisterFromChallenge = async (resourceId: string): Promise<void> => {
    await xhrDeleteAsync<void>(`${challengeBaseUrl}/resources/${resourceId}`)
}

/**
 * Fetches resources for a challenge.
 *
 * @param challengeId Challenge identifier.
 * @returns Paginated resource data.
 */
export const fetchChallengeResources = async (
    challengeId: string,
): Promise<PaginatedResponse<BackendResource[]>> => {
    const query = qs.stringify({ challengeId })

    return xhrGetPaginatedAsync<BackendResource[]>(
        `${challengeBaseUrl}/resources?${query}`,
    )
}

/**
 * Fetches submitter registrants for a challenge.
 *
 * @param challengeId Challenge identifier.
 * @returns Registrant records required by challenge detail view.
 */
export const fetchChallengeRegistrants = async (
    challengeId: string,
): Promise<BackendRegistrant[]> => {
    const query = qs.stringify({ roleId: SUBMITTER_ROLE_ID })
    const endpoint = `${challengeBaseUrl}/challenges/${challengeId}/resources?${query}`
    const resources = await xhrGetAsync<BackendRegistrantResource[]>(endpoint)

    return resources.map(resource => ({
        countryCode: resource.countryCode ?? resource.countryInfo?.countryCode,
        countryFlag: resource.countryFlag ?? resource.countryInfo?.countryFlag,
        created: resource.created ?? resource.createdAt ?? '',
        memberHandle: resource.memberHandle ?? resource.userHandle ?? '',
        rating: resource.rating,
        submissionDate: resource.submissionDate ?? resource.submissionTime,
    }))
}
