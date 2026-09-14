import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

import { MemberProfileSummary } from '../models'

const MEMBER_FIELDS = 'userId,handle,photoURL,maxRating'
const MEMBER_BATCH_SIZE = 50
const MEMBER_REQUEST_BATCH_SIZE = 4

interface UnknownRecord {
    [key: string]: unknown
}

/**
 * Converts an arbitrary member field to a trimmed string.
 *
 * @param value unknown Members API field.
 * @returns non-empty text, or undefined.
 * @throws Does not throw.
 */
function optionalString(value: unknown): string | undefined {
    if (value === undefined || value === null) return undefined
    const normalized = String(value)
        .trim()
    return normalized || undefined
}

/**
 * Converts numeric member fields, including nested max-rating payloads.
 *
 * @param value scalar rating or object containing a rating field.
 * @returns finite rating, or undefined.
 * @throws Does not throw.
 */
function optionalNumber(value: unknown): number | undefined {
    const normalized = typeof value === 'object' && value
        ? (value as UnknownRecord).rating
        : value
    const number = Number(normalized)
    return Number.isFinite(number) ? number : undefined
}

/**
 * Allows only absolute HTTP(S) member photos before passing them to an image.
 *
 * @param value candidate Members API photo URL.
 * @returns normalized safe URL, or undefined.
 * @throws Does not throw.
 */
function safePhotoUrl(value: unknown): string | undefined {
    const candidate = optionalString(value)
    if (!candidate) return undefined
    try {
        const url = new URL(candidate)
        return ['http:', 'https:'].includes(url.protocol) ? url.toString() : undefined
    } catch (error) {
        return undefined
    }
}

/**
 * Normalizes one unknown Members API row into the shared summary contract.
 *
 * @param value raw member row.
 * @returns valid member summary, or undefined when identity fields are absent.
 * @throws Does not throw.
 */
function normalizeMember(value: unknown): MemberProfileSummary | undefined {
    if (typeof value !== 'object' || !value) return undefined
    const row = value as UnknownRecord
    const userId = optionalString(row.userId)
    const handle = optionalString(row.handle)
    if (!userId || !handle) return undefined
    return {
        handle,
        maxRating: optionalNumber(row.maxRating ?? row.rating),
        photoURL: safePhotoUrl(row.photoURL),
        userId,
    }
}

/**
 * Accepts the bare and envelope response variants deployed by Members API.
 *
 * @param value unknown Members API payload.
 * @returns normalized valid member summaries.
 * @throws Does not throw.
 */
function extractMembers(value: unknown): MemberProfileSummary[] {
    if (Array.isArray(value)) {
        return value.map(normalizeMember)
            .filter((member): member is MemberProfileSummary => !!member)
    }

    if (typeof value !== 'object' || !value) return []
    const response = value as UnknownRecord
    const candidates = [response.data, response.result, (response.result as UnknownRecord | undefined)?.content]
    const list = candidates.find(Array.isArray)

    return Array.isArray(list)
        ? list.map(normalizeMember)
            .filter((member): member is MemberProfileSummary => !!member)
        : []
}

/**
 * Builds a public Members API query for one bounded batch of user IDs.
 *
 * @param userIds unique member identifiers in the current batch.
 * @returns absolute field-projection URL.
 * @throws Does not throw.
 */
function memberBatchUrl(userIds: string[]): string {
    const url = new URL(`${EnvironmentConfig.API.V6}/members`)
    url.searchParams.set('fields', MEMBER_FIELDS)
    url.searchParams.set('page', '1')
    url.searchParams.set('perPage', String(userIds.length))
    userIds.forEach(userId => url.searchParams.append('userIds[]', userId))
    return url.toString()
}

/**
 * Loads public avatar and rating projections for a de-duplicated member-id set.
 * Failed batches resolve to an empty slice so consuming surfaces can retain
 * their initials fallback without failing their primary domain request.
 *
 * @param userIds Forums, Resources, or Winners API member identifiers.
 * @returns de-duplicated valid member summaries in API batch order.
 * @throws Does not throw; individual Members API failures become empty batches.
 */
export async function getMemberProfilesByUserIds(userIds: string[]): Promise<MemberProfileSummary[]> {
    const uniqueIds = Array.from(new Set(
        userIds.map(optionalString)
            .filter((userId): userId is string => !!userId),
    ))
    if (!uniqueIds.length) return []
    const batches = Array.from(
        { length: Math.ceil(uniqueIds.length / MEMBER_BATCH_SIZE) },
        (_, index) => uniqueIds.slice(index * MEMBER_BATCH_SIZE, (index + 1) * MEMBER_BATCH_SIZE),
    )
    const responses: MemberProfileSummary[][] = []
    for (let offset = 0; offset < batches.length; offset += MEMBER_REQUEST_BATCH_SIZE) {
        const requestBatch = batches.slice(offset, offset + MEMBER_REQUEST_BATCH_SIZE)
        // eslint-disable-next-line no-await-in-loop
        responses.push(...await Promise.all(requestBatch.map(async batch => {
            try {
                return extractMembers(await xhrGetAsync<unknown>(memberBatchUrl(batch)))
            } catch (error) {
                return []
            }
        })))
    }

    const members = responses.flat()
    return members.filter((member, index) => (
        members.findIndex(candidate => candidate.userId === member.userId) === index
    ))
}
