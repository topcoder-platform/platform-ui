/**
 * Util for challenge
 */

import type { BackendMetadata, ChallengeInfo } from '../models'

/**
 * Check if challenge is in the review phase
 * @param challengeInfo challenge info
 * @returns true if challenge is in the review phase
 */
export function isReviewPhase(challengeInfo?: ChallengeInfo): boolean {
    return (challengeInfo?.currentPhase ?? '').indexOf('Review') >= 0
}

/**
 * Check if challenge is in the appeals phase
 * @param challengeInfo challenge info
 * @returns true if challenge is in the appeals phase
 */
export function isAppealsPhase(challengeInfo?: ChallengeInfo): boolean {
    return challengeInfo?.currentPhase === 'Appeals'
}

/**
 * Check if challenge is in the appeals response phase
 * @param challengeInfo challenge info
 * @returns true if challenge is in the appeals response phase
 */
export function isAppealsResponsePhase(challengeInfo?: ChallengeInfo): boolean {
    return challengeInfo?.currentPhase === 'Appeals Response'
}

const SUBMISSION_LIMIT_KEY = 'submissionlimit'
const UNLIMITED_KEYWORDS = ['unlimited', 'false', '0', 'no', 'none']
const TRUE_KEYWORDS = ['true', 'yes', '1']

function parseBooleanFlag(value: unknown): boolean | undefined {
    if (typeof value === 'boolean') {
        return value
    }

    if (typeof value === 'number') {
        if (value === 1) return true
        if (value === 0) return false
        return undefined
    }

    if (typeof value === 'string') {
        const normalized = value.trim()
            .toLowerCase()
        if (!normalized) {
            return undefined
        }

        if (TRUE_KEYWORDS.includes(normalized)) {
            return true
        }

        if (UNLIMITED_KEYWORDS.includes(normalized)) {
            return false
        }
    }

    return undefined
}

function hasPositiveNumeric(value: unknown): boolean {
    if (value === undefined || value === null) {
        return false
    }

    const numeric = Number(value)
    return Number.isFinite(numeric) && numeric > 0
}

function findSubmissionLimitMetadata(metadata: BackendMetadata[] | undefined): unknown {
    if (!Array.isArray(metadata)) {
        return undefined
    }

    const entry = metadata.find(candidate => (candidate?.name || '').toLowerCase() === SUBMISSION_LIMIT_KEY)
    return entry?.value
}

function normalizeLimitMetadataValue(rawValue: unknown): unknown {
    if (typeof rawValue !== 'string') {
        return rawValue
    }

    const trimmed = rawValue.trim()
    if (!trimmed) {
        return ''
    }

    try {
        return JSON.parse(trimmed)
    } catch {
        return trimmed
    }
}

function evaluateStringLimit(value: string): boolean {
    const trimmed = value.trim()
    if (!trimmed) {
        return false
    }

    if (hasPositiveNumeric(trimmed)) {
        return true
    }

    const normalized = trimmed.toLowerCase()
    if (UNLIMITED_KEYWORDS.includes(normalized)) {
        return false
    }

    const boolFlag = parseBooleanFlag(trimmed)
    if (boolFlag !== undefined) {
        return boolFlag
    }

    return false
}

function evaluateObjectLimit(candidate: Record<string, unknown>): boolean {
    const unlimitedFlag = parseBooleanFlag(candidate.unlimited)
    if (unlimitedFlag === true) {
        return false
    }

    const numericCandidates: unknown[] = [
        candidate.count,
        candidate.max,
        candidate.maximum,
        candidate.limitCount,
        candidate.value,
    ]

    if (numericCandidates.some(candidateValue => hasPositiveNumeric(candidateValue))) {
        return true
    }

    const limitFlag = parseBooleanFlag(candidate.limit)
    if (limitFlag !== undefined) {
        return limitFlag
    }

    return false
}

export function challengeHasSubmissionLimit(challengeInfo?: ChallengeInfo): boolean {
    const rawValue = findSubmissionLimitMetadata(challengeInfo?.metadata)
    if (rawValue === undefined || rawValue === null) {
        return false
    }

    const normalized = normalizeLimitMetadataValue(rawValue)

    if (typeof normalized === 'number') {
        return hasPositiveNumeric(normalized)
    }

    if (typeof normalized === 'boolean') {
        return normalized
    }

    if (typeof normalized === 'string') {
        return evaluateStringLimit(normalized)
    }

    if (normalized && typeof normalized === 'object') {
        return evaluateObjectLimit(normalized as Record<string, unknown>)
    }

    return false
}

export function shouldRestrictToLatestSubmissions(challengeInfo?: ChallengeInfo): boolean {
    return !challengeHasSubmissionLimit(challengeInfo)
}
