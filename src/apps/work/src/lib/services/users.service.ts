import { xhrGetAsync } from '~/libs/core'

import { MEMBER_API_URL } from '../constants'
import { User } from '../models'

const USER_PROFILE_FIELDS = 'userId,handle,firstName,lastName,email'
const SEARCH_BY_USER_IDS_CHUNK_SIZE = 50

function normalizeError(error: unknown, fallbackMessage: string): Error {
    const typedError = error as {
        message?: string
        response?: {
            data?: {
                message?: string
            }
        }
    }

    const errorMessage = typedError?.response?.data?.message
        || typedError?.message
        || fallbackMessage

    return new Error(errorMessage)
}

function normalizeUser(user: Partial<User>): User | undefined {
    const handle = typeof user.handle === 'string'
        ? user.handle.trim()
        : ''

    if (!handle) {
        return undefined
    }

    const userId = user.userId !== undefined && user.userId !== null
        ? String(user.userId)
        : ''

    return {
        email: typeof user.email === 'string'
            ? user.email
            : undefined,
        firstName: typeof user.firstName === 'string'
            ? user.firstName
            : undefined,
        handle,
        lastName: typeof user.lastName === 'string'
            ? user.lastName
            : undefined,
        userId,
    }
}

function extractUsers(response: unknown): User[] {
    if (Array.isArray(response)) {
        return response
            .map(user => normalizeUser(user as Partial<User>))
            .filter((user): user is User => !!user)
    }

    if (typeof response === 'object' && response) {
        const typedResponse = response as {
            result?: unknown
        }

        if (Array.isArray(typedResponse.result)) {
            return typedResponse.result
                .map(user => normalizeUser(user as Partial<User>))
                .filter((user): user is User => !!user)
        }
    }

    return []
}

export async function fetchProfile(handle: string): Promise<User | undefined> {
    const normalizedHandle = handle.trim()

    if (!normalizedHandle) {
        return undefined
    }

    try {
        const profile = await xhrGetAsync<Partial<User>>(
            `${MEMBER_API_URL}/${encodeURIComponent(normalizedHandle)}`,
        )

        return normalizeUser(profile)
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch member profile')
    }
}

export async function suggestProfiles(partialHandle: string): Promise<User[]> {
    const normalizedPartialHandle = partialHandle.trim()

    if (!normalizedPartialHandle) {
        return []
    }

    try {
        const response = await xhrGetAsync<unknown>(
            `${MEMBER_API_URL}/autocomplete?term=${encodeURIComponent(normalizedPartialHandle)}`,
        )

        return extractUsers(response)
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch member suggestions')
    }
}

export async function searchProfilesByUserIds(userIds: string[]): Promise<User[]> {
    const uniqueUserIds = Array.from(new Set(
        userIds
            .map(userId => userId.trim())
            .filter(Boolean),
    ))

    if (!uniqueUserIds.length) {
        return []
    }

    const userIdChunks = Array.from({
        length: Math.ceil(uniqueUserIds.length / SEARCH_BY_USER_IDS_CHUNK_SIZE),
    }, (_, chunkIndex) => uniqueUserIds.slice(
        chunkIndex * SEARCH_BY_USER_IDS_CHUNK_SIZE,
        (chunkIndex + 1) * SEARCH_BY_USER_IDS_CHUNK_SIZE,
    ))

    try {
        const responses = await Promise.all(userIdChunks
            .map(async chunkUserIds => {
                const searchQuery = new URLSearchParams({
                    fields: USER_PROFILE_FIELDS,
                    page: '1',
                    perPage: String(chunkUserIds.length),
                    userIds: chunkUserIds.join(','),
                })

                return xhrGetAsync<unknown>(
                    `${MEMBER_API_URL}?${searchQuery.toString()}`,
                )
            }))

        const aggregatedUsers: User[] = responses
            .flatMap(response => extractUsers(response))

        const seenUserIds = new Set<string>()

        return aggregatedUsers.filter(user => {
            if (seenUserIds.has(user.userId)) {
                return false
            }

            seenUserIds.add(user.userId)
            return true
        })
    } catch (error) {
        throw normalizeError(error, 'Failed to search member profiles')
    }
}
