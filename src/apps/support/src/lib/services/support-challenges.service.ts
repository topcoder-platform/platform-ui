/** Active, resource-scoped challenge lookup for Support request association. */
import { EnvironmentConfig } from '~/config'
import {
    PaginatedResponse,
    xhrCreateInstance,
    xhrGetPaginatedAsync,
} from '~/libs/core'

import { SupportChallenge } from '../models'

const ACTIVE_CHALLENGE_PAGE_SIZE = 100
const challengeApiUrl = (
    EnvironmentConfig.CHALLENGE_API_URL
    || `${EnvironmentConfig.API.V6}/challenges`
).replace(/\/$/, '')
const challengeApiClient = xhrCreateInstance()

if (EnvironmentConfig.CHALLENGE_API_VERSION) {
    challengeApiClient.defaults.headers.common['app-version'] = EnvironmentConfig.CHALLENGE_API_VERSION
}

interface RawSupportChallenge {
    id?: unknown
    name?: unknown
}

/**
 * Builds one authenticated Challenge API search URL for a member's active resources.
 *
 * @param memberId authenticated Topcoder member identifier.
 * @param page one-based Challenge API result page.
 * @returns encoded Challenge API URL for the requested page.
 * @throws Does not throw.
 */
function buildActiveChallengesUrl(memberId: string, page: number): string {
    const query = new URLSearchParams({
        memberId,
        page: String(page),
        perPage: String(ACTIVE_CHALLENGE_PAGE_SIZE),
        sortBy: 'name',
        sortOrder: 'asc',
        status: 'ACTIVE',
    })

    return `${challengeApiUrl}?${query.toString()}`
}

/**
 * Converts an untrusted Challenge API row into the small option shape Support needs.
 *
 * @param challenge raw Challenge API result.
 * @returns normalized challenge, or undefined when the identifier is missing.
 * @throws Does not throw.
 */
function normalizeSupportChallenge(challenge: RawSupportChallenge): SupportChallenge | undefined {
    const id = challenge.id === undefined || challenge.id === null
        ? ''
        : String(challenge.id)
            .trim()
    if (!id) return undefined

    const name = typeof challenge.name === 'string'
        ? challenge.name.trim()
        : ''

    return {
        id,
        name: name || id,
    }
}

/**
 * Fetches every active challenge on which the authenticated member has a resource.
 *
 * @param memberId authenticated Topcoder member identifier.
 * @returns unique challenges sorted by display name and then identifier.
 * @throws Propagates Challenge API request failures to the caller.
 */
export async function getActiveMemberChallenges(memberId: string | number): Promise<SupportChallenge[]> {
    const normalizedMemberId = String(memberId)
        .trim()
    if (!normalizedMemberId) return []

    const firstPage = await xhrGetPaginatedAsync<RawSupportChallenge[]>(
        buildActiveChallengesUrl(normalizedMemberId, 1),
        challengeApiClient,
    )
    const totalPages = Math.max(1, firstPage.totalPages || 1)
    const remainingPages: Array<Promise<PaginatedResponse<RawSupportChallenge[]>>> = []

    for (let page = 2; page <= totalPages; page += 1) {
        remainingPages.push(xhrGetPaginatedAsync<RawSupportChallenge[]>(
            buildActiveChallengesUrl(normalizedMemberId, page),
            challengeApiClient,
        ))
    }

    const extraPages = await Promise.all(remainingPages)
    const uniqueChallenges = [
        ...(firstPage.data || []),
        ...extraPages.flatMap(page => page.data || []),
    ]
        .map(normalizeSupportChallenge)
        .filter((challenge): challenge is SupportChallenge => !!challenge)
        .reduce<Map<string, SupportChallenge>>((result, challenge) => {
            if (!result.has(challenge.id)) result.set(challenge.id, challenge)
            return result
        }, new Map())

    return Array.from(uniqueChallenges.values())
        .sort((left, right) => left.name.localeCompare(right.name) || left.id.localeCompare(right.id))
}
