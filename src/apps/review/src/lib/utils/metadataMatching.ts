/**
 * Util for matching review metadata against challenge phase names and criteria.
 */
import type { BackendReview } from '../models'

import { parseReviewMetadataObject } from './reviewMetadataParsing'

/**
 * Describes how review metadata matched a phase name.
 */
export type MetadataPhaseMatch = {
    source: 'jsonField' | 'stringExact' | 'stringBoundary'
    key?: string
}

/**
 * Normalizes review metadata into a comparable string representation.
 *
 * @param metadata - Raw metadata associated with the review.
 * @returns Normalized string value or an empty string when metadata cannot be interpreted.
 */
export function normalizeReviewMetadata(metadata: BackendReview['metadata']): string {
    if (!metadata) {
        return ''
    }

    if (typeof metadata === 'string') {
        return metadata
    }

    if (typeof metadata === 'object') {
        try {
            return JSON.stringify(metadata)
        } catch {
            return ''
        }
    }

    return ''
}

/**
 * Escapes special characters so a metadata value can be embedded safely in a RegExp literal.
 *
 * @param value - Value to escape for use inside a regular expression literal.
 * @returns Escaped string safe for interpolation in a regex.
 */
export function escapeRegexLiteral(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Finds the most specific way metadata matches a normalized phase name. The priority order is:
 * JSON fields, exact string comparison, then word-boundary matching.
 *
 * @param metadata - Review metadata to inspect.
 * @param normalizedPhaseName - Target phase name that has already been normalized to lowercase.
 * @returns Match detail describing the source of the match, if any.
 */
export function findMetadataPhaseMatch(
    metadata: BackendReview['metadata'],
    normalizedPhaseName: string,
): MetadataPhaseMatch | undefined {
    if (!metadata) {
        return undefined
    }

    const target = normalizedPhaseName.trim()
    if (!target) {
        return undefined
    }

    const metadataObject = parseReviewMetadataObject(metadata)
    if (metadataObject) {
        const candidateKeys = ['phaseName', 'phaseType', 'reviewType', 'type'] as const
        for (const key of candidateKeys) {
            const value = metadataObject[key]
            if (typeof value === 'string') {
                if (value.trim()
                    .toLowerCase() === target) {
                    return {
                        key,
                        source: 'jsonField',
                    }
                }
            }

            if (Array.isArray(value)) {
                const matched = value.some(item => typeof item === 'string'
                    && item.trim()
                        .toLowerCase() === target)
                if (matched) {
                    return {
                        key,
                        source: 'jsonField',
                    }
                }
            }
        }

        return undefined
    }

    if (typeof metadata === 'string') {
        const normalizedMetadata = metadata.trim()
            .toLowerCase()
        if (!normalizedMetadata) {
            return undefined
        }

        if (normalizedMetadata === target) {
            return { source: 'stringExact' }
        }

        const escapedTarget = escapeRegexLiteral(target)
            .replace(/ /g, '\\ ')
        const sepInsensitive = new RegExp(`\\b${escapedTarget.replace(/\\ /g, '[-_\\s]+')}\\b`)
        if (sepInsensitive.test(normalizedMetadata)) {
            return { source: 'stringBoundary' }
        }
    }

    return undefined
}

/**
 * Convenience wrapper to report whether metadata matched a given phase.
 *
 * @param metadata - Review metadata to inspect.
 * @param normalizedPhaseName - Target phase name that has already been normalized to lowercase.
 * @returns True when the metadata matches the supplied phase.
 */
export function metadataMatchesPhase(
    metadata: BackendReview['metadata'],
    normalizedPhaseName: string,
): boolean {
    return Boolean(findMetadataPhaseMatch(metadata, normalizedPhaseName))
}

/**
 * Detailed metadata match information derived from {@link findMetadataPhaseMatch}.
 */
export type MetadataPhaseMatchDetail = ReturnType<typeof findMetadataPhaseMatch>

/**
 * Normalizes a string by trimming and converting it to lowercase.
 *
 * @param value - Value to normalize.
 * @returns Lowercase trimmed string or undefined when normalization fails.
 */
export function getNormalizedLowerCase(value?: string | null): string | undefined {
    if (typeof value !== 'string') {
        return undefined
    }

    const trimmedValue = value.trim()
    return trimmedValue ? trimmedValue.toLowerCase() : undefined
}

/**
 * Normalizes a string to lowercase letters by stripping non alphabetic characters.
 *
 * @param value - Value to normalize.
 * @returns Lowercase alphabetic string or undefined when normalization fails.
 */
export function getNormalizedAlphaLowerCase(value?: string | null): string | undefined {
    const normalized = getNormalizedLowerCase(value)
    return normalized ? normalized.replace(/[^a-z]/g, '') : undefined
}

/**
 * Indicates whether the provided phase name should be considered review related.
 *
 * @param phaseName - Phase name to evaluate.
 * @returns True when the phase name is allowed for review operations.
 */
export function isPhaseAllowedForReview(phaseName?: string | null): boolean {
    const normalizedAlpha = getNormalizedAlphaLowerCase(phaseName)
    if (!normalizedAlpha) {
        return true
    }

    return normalizedAlpha === 'review'
        || normalizedAlpha === 'postmortem'
        || normalizedAlpha === 'approval'
}

/**
 * Builds metadata match criteria strings suitable for debugging and logging.
 *
 * @param detail - Match detail returned by {@link findMetadataPhaseMatch}.
 * @returns Criteria tokens describing how metadata matched the phase.
 */
export function buildMetadataCriteria(detail: MetadataPhaseMatchDetail): string[] {
    if (!detail) {
        return []
    }

    if (detail.source === 'jsonField' && detail.key) {
        return [`metadataField:${detail.key}`]
    }

    if (detail.source === 'stringExact') {
        return ['metadataExactString']
    }

    if (detail.source === 'stringBoundary') {
        return ['metadataWordBoundary']
    }

    return ['metadataPhaseMatch']
}
