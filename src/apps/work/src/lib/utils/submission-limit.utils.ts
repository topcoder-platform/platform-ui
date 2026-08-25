import { ChallengeMetadata } from '../models'

import { getMetadataValue } from './metadata.utils'

export const SUBMISSION_LIMIT_METADATA_NAME = 'submissionLimit'
export const SUBMISSION_LIMIT_LIMITED_MODE = 'limited'
export const SUBMISSION_LIMIT_UNLIMITED_MODE = 'unlimited'
export const SUBMISSION_LIMIT_COUNT_REQUIRED_MESSAGE
    = 'Enter a submission limit of at least 1 when submissions are limited'

export type SubmissionLimitMode =
    typeof SUBMISSION_LIMIT_LIMITED_MODE
    | typeof SUBMISSION_LIMIT_UNLIMITED_MODE

export interface SubmissionLimitMetadata {
    count: string
    mode: SubmissionLimitMode
}

const defaultSubmissionLimitMetadata: SubmissionLimitMetadata = {
    count: '',
    mode: SUBMISSION_LIMIT_UNLIMITED_MODE,
}

/**
 * Converts legacy string and boolean flags to a strict boolean.
 *
 * @param value legacy metadata flag.
 * @returns Whether the flag is enabled.
 * @throws Does not throw.
 */
function toBoolean(value: unknown): boolean {
    return value === true || value === 'true'
}

/**
 * Removes non-numeric characters from a submission-limit count.
 *
 * @param value raw form or metadata value.
 * @returns The digits-only submission count.
 * @throws Does not throw.
 */
export function sanitizeSubmissionLimitCount(value: string): string {
    return value.replace(/[^\d]/g, '')
}

/**
 * Parses the legacy JSON string stored in `submissionLimit` challenge metadata.
 *
 * Missing, malformed, and explicitly non-limited values use the product default of unlimited.
 * A positive count without either flag is retained for compatibility with older payloads.
 *
 * @param value serialized challenge metadata value.
 * @returns The submission-limit mode and sanitized count used by the form.
 * @throws Does not throw; malformed metadata falls back to unlimited.
 */
export function parseSubmissionLimitMetadata(value: string | undefined): SubmissionLimitMetadata {
    if (!value) {
        return defaultSubmissionLimitMetadata
    }

    try {
        const parsedValue = JSON.parse(value) as unknown

        if (!parsedValue || typeof parsedValue !== 'object' || Array.isArray(parsedValue)) {
            return defaultSubmissionLimitMetadata
        }

        const parsedMetadata = parsedValue as Record<string, unknown>
        const rawCount = typeof parsedMetadata.count === 'string'
            || typeof parsedMetadata.count === 'number'
            ? String(parsedMetadata.count)
            : ''
        const count = sanitizeSubmissionLimitCount(rawCount)
        const isUnlimited = toBoolean(parsedMetadata.unlimited)
        const isLimited = toBoolean(parsedMetadata.limit)
            || (!isUnlimited && Number(count) > 0)

        return {
            count: isLimited
                ? count
                : '',
            mode: isLimited
                ? SUBMISSION_LIMIT_LIMITED_MODE
                : SUBMISSION_LIMIT_UNLIMITED_MODE,
        }
    } catch {
        return defaultSubmissionLimitMetadata
    }
}

/**
 * Serializes the editor state to the legacy submission-limit metadata contract.
 *
 * @param mode selected unlimited or limited mode.
 * @param count digits-only maximum submission count.
 * @returns The JSON string persisted in challenge metadata.
 * @throws Does not throw.
 */
export function serializeSubmissionLimitMetadata(
    mode: SubmissionLimitMode,
    count: string | undefined,
): string {
    const isLimited = mode === SUBMISSION_LIMIT_LIMITED_MODE

    return JSON.stringify({
        count: isLimited
            ? (count || '')
            : '',
        limit: isLimited
            ? 'true'
            : 'false',
        unlimited: isLimited
            ? 'false'
            : 'true',
    })
}

/**
 * Detects a limited submission setting that is missing a usable count.
 *
 * @param metadata current challenge metadata entries.
 * @returns `true` when submissions are limited but no positive count is configured.
 * @throws Does not throw.
 */
export function isSubmissionLimitCountMissing(metadata: ChallengeMetadata[] | undefined): boolean {
    const submissionLimit = parseSubmissionLimitMetadata(
        getMetadataValue(metadata, SUBMISSION_LIMIT_METADATA_NAME),
    )

    return submissionLimit.mode === SUBMISSION_LIMIT_LIMITED_MODE
        && Number(submissionLimit.count || 0) < 1
}

/**
 * Normalizes a challenge submission counter that form values expose as an unknown value.
 *
 * @param value raw counter from a challenge payload or watched form value.
 * @returns The counter as a finite number, or `0` when it is missing or not numeric.
 * @throws Does not throw.
 */
function toSubmissionCount(value: unknown): number {
    const count = Number(value ?? 0)

    return Number.isFinite(count)
        ? count
        : 0
}

/**
 * Reports whether members have already uploaded contest or checkpoint submissions.
 *
 * @param counts challenge or form submission counters.
 * @returns `true` when at least one submission of either type exists.
 * @throws Does not throw.
 */
export function hasChallengeSubmissions(
    counts: {
        numOfCheckpointSubmissions?: unknown
        numOfSubmissions?: unknown
    } | undefined,
): boolean {
    return toSubmissionCount(counts?.numOfSubmissions)
        + toSubmissionCount(counts?.numOfCheckpointSubmissions)
        > 0
}
