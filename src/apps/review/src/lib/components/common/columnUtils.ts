import { getRatingColor } from '~/libs/core'
import { EnvironmentConfig } from '~/config'

import type { SubmissionInfo } from '../../models/SubmissionInfo.model'
import { normalizeRatingValue } from '../../utils/rating'

/**
 * Resolves the proper color to use for a handle, falling back to rating-based colors.
 */
export const getHandleColor = (
    explicitColor: string | undefined,
    handle: string | undefined,
    maxRating: number | string | undefined | null,
): string | undefined => {
    const normalizedRating = normalizeRatingValue(
        typeof maxRating === 'number'
            || typeof maxRating === 'string'
            ? maxRating
            : undefined,
    )

    return explicitColor
        ?? (handle && normalizedRating !== undefined
            ? getRatingColor(normalizedRating)
            : undefined)
}

/**
 * Formats a numeric score value for table display.
 */
export const formatScoreDisplay = (score: number | undefined | null): string | undefined => {
    if (typeof score === 'number' && Number.isFinite(score)) {
        return score.toFixed(2)
    }

    return undefined
}

/**
 * Builds a lookup map of submission metadata by ID by combining filtered and raw lists.
 */
export const createSubmissionMetaMap = (
    filteredSubmissions: SubmissionInfo[],
    allSubmissions: SubmissionInfo[],
): Map<string, SubmissionInfo> => {
    const map = new Map<string, SubmissionInfo>()

    filteredSubmissions.forEach(submission => {
        if (submission?.id) {
            map.set(submission.id, submission)
        }
    })

    allSubmissions.forEach(submission => {
        if (submission?.id && !map.has(submission.id)) {
            map.set(submission.id, submission)
        }
    })

    return map
}

/**
 * Builds a profile URL for the given handle using the configured environment base URL.
 */
export const getProfileUrl = (handle: string): string => {
    const baseUrl = EnvironmentConfig.REVIEW.PROFILE_PAGE_URL || ''
    const normalizedBase = baseUrl.replace(/\/+$/, '')

    return `${normalizedBase}/${encodeURIComponent(handle)}`
}

/**
 * converts size_in_bytes into KB / MB / GB with correct formatting.
 */
export const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes < 0) return '0 B'

    const KB = 1024
    const MB = KB * 1024
    const GB = MB * 1024

    if (bytes >= GB) {
        return `${(bytes / GB).toFixed(2)} GB`
    }

    if (bytes >= MB) {
        return `${(bytes / MB).toFixed(2)} MB`
    }

    if (bytes >= KB) {
        return `${(bytes / KB).toFixed(2)} KB`
    }

    return `${bytes} B`
}
