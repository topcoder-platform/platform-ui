import { BackendReview, Screening } from '../models'

/**
 * Util for parsing and extracting data from review metadata.
 */
export type ReviewerPhaseConfig = {
    scorecardId?: string
    phaseId?: string | number
    type?: string
}

export type MetadataRecord = Record<string, unknown>

/**
 * Parses a candidate value into a finite number.
 * @param value - Value to parse.
 * @returns Finite number when parsing succeeds; otherwise undefined.
 */
export function parseFiniteNumber(value: unknown): number | undefined {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : undefined
    }

    if (typeof value === 'string') {
        const trimmed = value.trim()
        if (!trimmed) {
            return undefined
        }

        const parsed = Number(trimmed)
        return Number.isFinite(parsed) ? parsed : undefined
    }

    return undefined
}

/**
 * Parses review metadata into an object when possible.
 * @param metadata - Metadata payload from the backend review.
 * @returns Parsed metadata object or undefined when parsing fails.
 */
export function parseReviewMetadataObject(metadata: BackendReview['metadata']): MetadataRecord | undefined {
    if (!metadata || metadata === null) {
        return undefined
    }

    if (typeof metadata === 'object') {
        return metadata as MetadataRecord
    }

    if (typeof metadata === 'string') {
        try {
            const parsed = JSON.parse(metadata)
            return typeof parsed === 'object' && parsed !== null
                ? parsed as MetadataRecord
                : undefined
        } catch {
            return undefined
        }
    }

    return undefined
}

/**
 * Extracts the normalized screening outcome stored within review metadata.
 * @param metadata - Metadata payload from the backend review.
 * @returns Screening outcome when discovered; otherwise undefined.
 */
export function extractOutcomeFromMetadata(metadata: BackendReview['metadata']): Screening['result'] | undefined {
    const metadataObject = parseReviewMetadataObject(metadata)

    const normalize = (value: string): Screening['result'] | undefined => {
        const normalized = value.trim()
            .toLowerCase()
        if (!normalized) {
            return undefined
        }

        if (normalized === 'pass') {
            return 'PASS'
        }

        if (normalized === 'fail' || normalized === 'no pass' || normalized === 'no-pass' || normalized === 'nopass') {
            return 'NO PASS'
        }

        return undefined
    }

    if (metadataObject) {
        const candidates = ['outcome', 'result', 'status']
        for (const key of candidates) {
            const raw = metadataObject[key]
            if (typeof raw === 'string') {
                const parsed = normalize(raw)
                if (parsed) {
                    return parsed
                }
            }
        }

        return undefined
    }

    if (typeof metadata === 'string') {
        return normalize(metadata)
    }

    return undefined
}
