import { EnvironmentConfig } from '~/config'
import {
    PaginatedResponse,
    xhrGetAsync,
    xhrGetPaginatedAsync,
    xhrPostAsync,
    xhrRequestAsync,
} from '~/libs/core'

import {
    Challenge,
    ChallengeFilterCriteria,
    ChallengeResource,
    ChallengeResourceFilterCriteria,
    ChallengeTrack,
    ChallengeType,
    ResourceEmail,
    ResourceRole,
} from '../models'
import { createChallengeQueryString } from '../utils'

const challengeBaseUrl = `${EnvironmentConfig.API.V5}`
const resourceBaseUrl = `${EnvironmentConfig.API.V5}`
const memberBaseUrl = `${EnvironmentConfig.API.V5}`

/**
 * Searches the challenges using v5 api.
 */
export const searchChallenges = async (
    filterCriteria: ChallengeFilterCriteria,
): Promise<PaginatedResponse<Challenge[]>> => xhrGetPaginatedAsync<Challenge[]>(
    `${challengeBaseUrl}/challenges?${createChallengeQueryString(filterCriteria)}`,
)

/**
 * Gets the challenge types.
 */
export const getChallengeTypes = async (): Promise<ChallengeType[]> => xhrGetAsync<ChallengeType[]>(
    `${challengeBaseUrl}/challenge-types?isActive=true`,
)

/**
 * Gets the challenge tracks.
 */
// eslint-disable-next-line max-len
export const getChallengeTracks = async (): Promise<ChallengeTrack[]> => xhrGetAsync<ChallengeTrack[]>(`${challengeBaseUrl}/challenge-tracks`)

/**
 * Gets the resource roles.
 */
// eslint-disable-next-line max-len
export const getResourceRoles = async (): Promise<ResourceRole[]> => xhrGetAsync<ResourceRole[]>(`${resourceBaseUrl}/resource-roles`)

/**
 * Gets the challenge details by legacyId.
 */
export const getChallengeByLegacyId = async (
    id: number,
): Promise<{ id: string }> => {
    const data = await xhrGetAsync<{ id: string }[]>(
        `${challengeBaseUrl}/challenges?legacyId=${id}`,
    )
    if (data.length) {
        return data[0]
    }

    throw new Error('Invalid "legacyId"')
}

/**
 * Get the challenge resources.
 */
export const getChallengeResources = async (
    challengeId: string,
    filterCriteria: ChallengeResourceFilterCriteria,
): Promise<PaginatedResponse<ChallengeResource[]>> => {
    let filter = `&page=${filterCriteria.page}&perPage=${filterCriteria.perPage}`
    if (filterCriteria.roleId !== '') filter += `&roleId=${filterCriteria.roleId}`
    return xhrGetPaginatedAsync<ChallengeResource[]>(
        `${resourceBaseUrl}/resources?challengeId=${challengeId}${filter}`,
    )
}

/**
 * Gets a list of e-mails based on a list of users.
 * @returns {Promise} the promise with a list of userIds and e-mails.
 */
export const getResourceEmails = async (
    users: ChallengeResource[],
): Promise<ResourceEmail[]> => {
    let qs: string
    if (users.length > 1) {
        qs = users.map(usr => `userIds=${usr.memberId}`)
            .join('&')
    } else {
        qs = users.length ? `userId=${users[0].memberId}` : ''
    }

    return xhrGetAsync<ResourceEmail[]>(
        `${memberBaseUrl}/members?${qs}&fields=userId,email&perPage=${users.length}`,
    )
}

/**
 * Deletes the challenge resource.
 */
export const deleteChallengeResource = async ({
    challengeId,
    memberHandle,
    roleId,
}: {
    challengeId: Challenge['id']
    memberHandle: ChallengeResource['memberHandle']
    roleId: ChallengeResource['roleId']
}): Promise<unknown> => xhrRequestAsync({
    data: { challengeId, memberHandle, roleId },
    method: 'delete',
    url: `${resourceBaseUrl}/resources`,
})

export const addChallengeResource = async (data: {
    challengeId: string
    memberHandle: string
    roleId: string
}): Promise<unknown> => xhrPostAsync(`${EnvironmentConfig.API.V5}/resources`, data)

/**
 * Gets the challenge details by id.
 * @param {string} id the challenge id.
 */
export const getChallengeById = async (
    id: Challenge['id'],
): Promise<Challenge> => xhrGetAsync<Challenge>(`${challengeBaseUrl}/challenges/${id}`)
