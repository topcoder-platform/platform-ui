import _ from 'lodash'

import { EnvironmentConfig } from '~/config'
import {
    PaginatedResponse,
    xhrGetAsync,
    xhrGetPaginatedAsync,
    xhrPatchAsync,
    xhrPostAsync,
    xhrRequestAsync,
} from '~/libs/core'

import {
    Challenge,
    ChallengeFilterCriteria,
    ChallengeResource,
    ChallengeTrack,
    ChallengeType,
    ChallengeWinner,
    ResourceEmail,
    ResourceRole,
} from '../models'
import { createChallengeQueryString } from '../utils'

const challengeBaseUrl = `${EnvironmentConfig.API.V6}`
const resourceBaseUrl = `${EnvironmentConfig.API.V6}`
const memberBaseUrl = `${EnvironmentConfig.API.V6}`

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
    filterCriteria: {[key: string]: string | number},
): Promise<PaginatedResponse<ChallengeResource[]>> => {
    let filter = ''
    _.forOwn(filterCriteria, (value, key) => {
        if (!!value) filter += `&${key}=${value}`
    })
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
    if (!users.length) {
        return Promise.resolve([])
    }

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
}): Promise<unknown> => xhrPostAsync(`${resourceBaseUrl}/resources`, data)

/**
 * Gets the challenge details by id.
 * @param {string} id the challenge id.
 */
export const getChallengeById = async (
    id: Challenge['id'],
): Promise<Challenge> => xhrGetAsync<Challenge>(`${challengeBaseUrl}/challenges/${id}`)

type UpdateChallengePayload = {
    status?: Challenge['status']
    winners?: Array<
        Pick<ChallengeWinner, 'handle' | 'placement' | 'userId'>
    >
}

/**
 * Partially updates challenge details by id.
 * @param {string} id the challenge id.
 * @param {UpdateChallengePayload} data challenge update payload.
 */
export const updateChallengeById = async (
    id: Challenge['id'],
    data: UpdateChallengePayload,
): Promise<Challenge> => xhrPatchAsync<UpdateChallengePayload, Challenge>(
    `${challengeBaseUrl}/challenges/${id}`,
    data,
)
