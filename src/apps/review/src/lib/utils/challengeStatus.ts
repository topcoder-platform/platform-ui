/**
 * Utilities for challenge status display and selection.
 */
import { startCase, toLower } from 'lodash'

import { SelectOption } from '../models'

const CANCELLED_PREFIX = 'CANCELLED_'

export const PAST_CHALLENGE_STATUSES = [
    'COMPLETED',
    'CANCELLED',
    'CANCELLED_FAILED_REVIEW',
    'CANCELLED_FAILED_SCREENING',
    'CANCELLED_ZERO_SUBMISSIONS',
    'CANCELLED_CLIENT_REQUEST',
] as const

export type PastChallengeStatus = typeof PAST_CHALLENGE_STATUSES[number]

export const CHALLENGE_STATUS_SELECT_ALL_OPTION: SelectOption = {
    label: 'All statuses',
    value: '',
}

/**
 * Normalise API challenge status values into human readable labels.
 */
export function formatChallengeStatus(status?: string): string {
    if (!status) {
        return 'Unknown'
    }

    const normalized = status.trim()
        .toUpperCase()
    if (!normalized) {
        return 'Unknown'
    }

    if (normalized === 'CANCELLED') {
        return 'Cancelled'
    }

    if (normalized.startsWith(CANCELLED_PREFIX)) {
        const reason = normalized.slice(CANCELLED_PREFIX.length)
        if (!reason) {
            return 'Cancelled'
        }

        return `Cancelled: ${startCase(toLower(reason))}`
    }

    return startCase(toLower(normalized))
}

/**
 * Select options for the past challenge status dropdown.
 */
export const PAST_CHALLENGE_STATUS_OPTIONS: SelectOption[] = [
    CHALLENGE_STATUS_SELECT_ALL_OPTION,
    ...PAST_CHALLENGE_STATUSES.map(status => ({
        label: formatChallengeStatus(status),
        value: status,
    })),
]
