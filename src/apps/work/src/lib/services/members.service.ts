import {
    xhrGetAsync,
    xhrPostAsync,
} from '~/libs/core'

import { MEMBER_API_URL } from '../constants'
import { MemberValidationResult } from '../models'

const DEFAULT_MEMBER_FIELDS = 'userId,handle,email,maxRating'
const SEARCH_BY_USER_IDS_CHUNK_SIZE = 50

interface UnknownRecord {
    [key: string]: unknown
}

export interface MemberMaxRating {
    rating?: number
}

export interface MemberProfile {
    email?: string
    handle?: string
    maxRating?: MemberMaxRating
    rating?: number
    userId: string
}

function toOptionalNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value
    }

    if (typeof value === 'string') {
        const parsedValue = Number(value)
        if (Number.isFinite(parsedValue)) {
            return parsedValue
        }
    }

    return undefined
}

function toOptionalString(value: unknown): string | undefined {
    if (value === undefined || value === null) {
        return undefined
    }

    const normalizedValue = String(value)
        .trim()

    return normalizedValue || undefined
}

function toMemberProfile(value: unknown): MemberProfile | undefined {
    if (typeof value !== 'object' || !value) {
        return undefined
    }

    const member = value as UnknownRecord
    const userId = toOptionalString(member.userId)
    if (!userId) {
        return undefined
    }

    const maxRatingValue = member.maxRating
    let maxRating: MemberMaxRating | undefined
    let rating = toOptionalNumber(member.rating)

    if (typeof maxRatingValue === 'object' && maxRatingValue) {
        const maxRatingRecord = maxRatingValue as UnknownRecord
        const maxRatingNumber = toOptionalNumber(maxRatingRecord.rating)
        if (maxRatingNumber !== undefined) {
            maxRating = {
                rating: maxRatingNumber,
            }
            rating = maxRatingNumber
        }
    }

    return {
        email: toOptionalString(member.email),
        handle: toOptionalString(member.handle),
        maxRating,
        rating,
        userId,
    }
}

function extractMembers(value: unknown): MemberProfile[] {
    if (Array.isArray(value)) {
        return value
            .map(member => toMemberProfile(member))
            .filter((member): member is MemberProfile => !!member)
    }

    if (typeof value !== 'object' || !value) {
        return []
    }

    const response = value as UnknownRecord
    const sourceLists: unknown[] = [
        response.result,
        response.data,
    ]

    for (const sourceList of sourceLists) {
        if (Array.isArray(sourceList)) {
            return sourceList
                .map(member => toMemberProfile(member))
                .filter((member): member is MemberProfile => !!member)
        }

        if (typeof sourceList === 'object' && sourceList) {
            const nestedData = (sourceList as UnknownRecord).data
            if (Array.isArray(nestedData)) {
                return nestedData
                    .map(member => toMemberProfile(member))
                    .filter((member): member is MemberProfile => !!member)
            }
        }
    }

    return []
}

function extractValidationResultRows(value: unknown): unknown[] {
    if (Array.isArray(value)) {
        return value
    }

    if (typeof value !== 'object' || !value) {
        return []
    }

    const response = value as UnknownRecord
    const sourceLists: unknown[] = [
        response.results,
        response.result,
        response.data,
    ]

    for (const sourceList of sourceLists) {
        if (Array.isArray(sourceList)) {
            return sourceList
        }

        if (typeof sourceList === 'object' && sourceList) {
            const nestedData = (sourceList as UnknownRecord).data
            if (Array.isArray(nestedData)) {
                return nestedData
            }
        }
    }

    return []
}

function getValidationInput(
    row: UnknownRecord,
    fallbackInput?: string,
): string | undefined {
    const email = toOptionalString(row.email)
    const handle = toOptionalString(row.handle)

    return toOptionalString(row.input)
        || toOptionalString(row.identifier)
        || handle
        || email
        || fallbackInput
}

function getValidationMatch(
    row: UnknownRecord,
    userId?: string,
): {
    match: boolean
    matched?: boolean
} {
    const matched = typeof row.matched === 'boolean'
        ? row.matched
        : undefined
    const match = typeof row.match === 'boolean'
        ? row.match
        : typeof matched === 'boolean'
            ? matched
            : !!userId

    return {
        match,
        matched,
    }
}

function getValidationUserId(row: UnknownRecord): string | undefined {
    return toOptionalString(row.userId)
        || toOptionalString(row.userID)
        || toOptionalString(row.memberId)
        || toOptionalString(row.id)
}

function toMemberValidationResult(
    value: unknown,
    fallbackInput?: string,
): MemberValidationResult | undefined {
    if (typeof value !== 'object' || !value) {
        return fallbackInput
            ? {
                input: fallbackInput,
                match: false,
            }
            : undefined
    }

    const row = value as UnknownRecord
    const email = toOptionalString(row.email)
    const handle = toOptionalString(row.handle)
    const input = getValidationInput(row, fallbackInput)
    const userId = getValidationUserId(row)

    if (!input) {
        return undefined
    }

    const validationMatch: {
        match: boolean
        matched?: boolean
    } = getValidationMatch(row, userId)

    return {
        email,
        handle,
        input,
        match: validationMatch.match,
        matched: validationMatch.matched,
        userId,
    }
}

export async function fetchMembersByUserIds(
    userIds: string[],
    fields: string = DEFAULT_MEMBER_FIELDS,
): Promise<MemberProfile[]> {
    const uniqueUserIds = Array.from(new Set(
        userIds
            .map(userId => toOptionalString(userId))
            .filter((userId): userId is string => !!userId),
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
        const responses = await Promise.all(userIdChunks.map(async userIdChunk => {
            const query = new URLSearchParams({
                fields,
                page: '1',
                perPage: String(userIdChunk.length),
                userIds: userIdChunk.join(','),
            })

            return xhrGetAsync<unknown>(
                `${MEMBER_API_URL}?${query.toString()}`,
            )
        }))

        const seenUserIds = new Set<string>()

        return responses
            .flatMap(response => extractMembers(response))
            .filter(member => {
                if (seenUserIds.has(member.userId)) {
                    return false
                }

                seenUserIds.add(member.userId)
                return true
            })
    } catch {
        return []
    }
}

export async function bulkSearchMembers(identifiers: string[]): Promise<MemberValidationResult[]> {
    const normalizedIdentifiers = identifiers
        .map(identifier => toOptionalString(identifier))
        .filter((identifier): identifier is string => !!identifier)

    if (!normalizedIdentifiers.length) {
        return []
    }

    const identifierChunks = Array.from({
        length: Math.ceil(normalizedIdentifiers.length / SEARCH_BY_USER_IDS_CHUNK_SIZE),
    }, (_, chunkIndex) => normalizedIdentifiers.slice(
        chunkIndex * SEARCH_BY_USER_IDS_CHUNK_SIZE,
        (chunkIndex + 1) * SEARCH_BY_USER_IDS_CHUNK_SIZE,
    ))

    const chunkResults = await Promise.all(identifierChunks.map(async identifierChunk => {
        try {
            const response = await xhrPostAsync<{
                identifiers: string[]
            }, unknown>(
                `${MEMBER_API_URL}/bulk-search`,
                {
                    identifiers: identifierChunk,
                },
            )

            return extractValidationResultRows(response)
                .map((row, index) => toMemberValidationResult(row, identifierChunk[index]))
                .filter((row): row is MemberValidationResult => !!row)
        } catch {
            return identifierChunk.map(identifier => ({
                input: identifier,
                match: false,
            }))
        }
    }))

    return chunkResults.flat()
}
