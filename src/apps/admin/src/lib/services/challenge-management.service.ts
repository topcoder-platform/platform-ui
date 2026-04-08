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
 * Gets all submitter resources for a challenge and returns a deduplicated,
 * handle-sorted list for challenge-scoped submitter selection in admin flows.
 * @param {string} challengeId challenge identifier used to load submitter resources.
 * @returns {Promise<ChallengeResource[]>} unique submitter resources sorted by member handle.
 * @throws {Error} Propagates request errors when resource roles or challenge resources cannot be loaded.
 */
export const getChallengeSubmitterResources = async (
    challengeId: string,
): Promise<ChallengeResource[]> => {
    const perPage = 200
    const roles = await getResourceRoles()
    const submitterRoleIds = roles
        .filter(role => role.name.toLowerCase()
            .includes('submitter'))
        .map(role => role.id)

    if (submitterRoleIds.length === 0) {
        return []
    }

    const resourcesByRole = await Promise.all(
        submitterRoleIds.map(async roleId => {
            const firstPageResponse = await getChallengeResources(challengeId, {
                page: 1,
                perPage,
                roleId,
            })
            const remainingPageRequests = Array.from(
                { length: Math.max(firstPageResponse.totalPages - 1, 0) },
                (_ignoredValue, index) => getChallengeResources(challengeId, {
                    page: index + 2,
                    perPage,
                    roleId,
                }),
            )
            const remainingPageResponses = await Promise.all(
                remainingPageRequests,
            )

            return [
                ...firstPageResponse.data,
                ...remainingPageResponses.flatMap(response => response.data),
            ]
        }),
    )

    const deduplicatedByMemberId = new Map<string, ChallengeResource>()
    resourcesByRole.flat()
        .forEach(resource => {
            if (!deduplicatedByMemberId.has(resource.memberId)) {
                deduplicatedByMemberId.set(resource.memberId, resource)
            }
        })

    return Array.from(deduplicatedByMemberId.values())
        .sort((left, right) => left.memberHandle.localeCompare(right.memberHandle))
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
