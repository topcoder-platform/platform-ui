/**
 * Service for the SHA-256 duplicate submission detection endpoint.
 */
import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

import { SubmissionDuplicate, SubmissionDuplicatesMap } from '../models'

const v6BaseUrl = `${EnvironmentConfig.API.V6}`

/** The API rejects requests carrying more submission ids than this. */
export const DUPLICATES_REQUEST_CHUNK_SIZE = 100

interface DuplicateGroupResponse {
    duplicates?: unknown
}

type DuplicatesResponse = Record<string, DuplicateGroupResponse | undefined>

function toOptionalString(value: unknown): string | undefined {
    if (value === undefined || value === null) {
        return undefined
    }

    const normalizedValue = String(value)
        .trim()

    return normalizedValue || undefined
}

/**
 * Splits submission ids into request-sized chunks.
 * @param submissionIds Unique submission ids to check.
 * @returns Chunks no larger than the API's per-request id limit.
 */
export function chunkSubmissionIds(submissionIds: string[]): string[][] {
    const chunks: string[][] = []

    for (let index = 0; index < submissionIds.length; index += DUPLICATES_REQUEST_CHUNK_SIZE) {
        chunks.push(submissionIds.slice(index, index + DUPLICATES_REQUEST_CHUNK_SIZE))
    }

    return chunks
}

/**
 * Normalizes one duplicate entry returned by the API.
 * @param value Raw duplicate entry.
 * @param challengeId Challenge the checked submission belongs to.
 * @returns Normalized duplicate, or `undefined` when the entry has no submission id.
 */
function toSubmissionDuplicate(
    value: unknown,
    challengeId: string,
): SubmissionDuplicate | undefined {
    if (typeof value !== 'object' || !value) {
        return undefined
    }

    const entry = value as Record<string, unknown>
    const submissionId = toOptionalString(entry.submissionId)

    if (!submissionId) {
        return undefined
    }

    const challenge = toOptionalString(entry.challenge)

    return {
        challenge,
        challengeTitle: toOptionalString(entry.challengeTitle),
        isCrossChallenge: !!challenge && challenge !== challengeId,
        submissionId,
        submittedAt: toOptionalString(entry.submittedAt),
        user: toOptionalString(entry.user),
    }
}

/**
 * Builds the cache key for a duplicate-detection request.
 * @param challengeId Challenge that owns the checked submissions.
 * @param submissionIds Submission ids being checked.
 * @param crossChallenge Whether other challenges are searched too.
 * @returns Stable SWR cache key, or `undefined` when there is nothing to fetch.
 */
export function getSubmissionDuplicatesCacheKey(
    challengeId?: string,
    submissionIds: string[] = [],
    crossChallenge: boolean = false,
): string | undefined {
    if (!challengeId || !submissionIds.length) {
        return undefined
    }

    return [
        `${v6BaseUrl}/submissions/${challengeId}/duplicates`,
        `crossChallenge=${crossChallenge}`,
        [...submissionIds].sort()
            .join(','),
    ].join('|')
}

/**
 * Fetches submissions sharing a SHA-256 digest with the supplied submissions.
 * @param challengeId Challenge that owns every checked submission.
 * @param submissionIds Submission ids to check; chunked to respect the API limit.
 * @param crossChallenge When true, duplicates from other challenges are included.
 * @returns Duplicate matches keyed by checked submission id.
 */
export async function fetchSubmissionDuplicates(
    challengeId: string,
    submissionIds: string[],
    crossChallenge: boolean = false,
): Promise<SubmissionDuplicatesMap> {
    const normalizedChallengeId = challengeId.trim()
    const uniqueSubmissionIds = Array.from(new Set(
        submissionIds
            .map(submissionId => toOptionalString(submissionId))
            .filter((submissionId): submissionId is string => !!submissionId),
    ))

    if (!normalizedChallengeId || !uniqueSubmissionIds.length) {
        return {}
    }

    const responses = await Promise.all(
        chunkSubmissionIds(uniqueSubmissionIds)
            .map(async chunk => {
                const query = new URLSearchParams()
                chunk.forEach(submissionId => {
                    query.append('submissionId', submissionId)
                })

                if (crossChallenge) {
                    query.set('crossChallenge', 'true')
                }

                return xhrGetAsync<DuplicatesResponse>(
                    `${v6BaseUrl}/submissions/${normalizedChallengeId}/duplicates?${query.toString()}`,
                )
            }),
    )

    return responses.reduce<SubmissionDuplicatesMap>((result, response) => {
        Object.entries(response ?? {})
            .forEach(([submissionId, group]) => {
                const rawDuplicates: unknown = group?.duplicates
                const duplicates: unknown[] = Array.isArray(rawDuplicates)
                    ? rawDuplicates
                    : []

                result[submissionId] = duplicates
                    .map(duplicate => toSubmissionDuplicate(duplicate, normalizedChallengeId))
                    .filter((duplicate): duplicate is SubmissionDuplicate => !!duplicate)
            })

        return result
    }, {})
}
