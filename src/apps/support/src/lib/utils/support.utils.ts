/** Pure presentation and authorization helpers for Support. */
import { EnvironmentConfig } from '~/config'
import { UserRole } from '~/libs/core'

import { SupportResponse } from '../models'

/**
 * Checks for the exact Support Team role while tolerating casing and whitespace.
 *
 * @param roles roles supplied by the authenticated global profile.
 * @returns true only when the Support Team role is present.
 * @throws Does not throw.
 */
export function isSupportTeamMember(roles: readonly string[] | undefined): boolean {
    const expected = UserRole.topcoderSupportTeam.toLowerCase()
    return Boolean(roles?.some(role => role.trim()
        .toLowerCase() === expected))
}

/**
 * Builds the environment-specific public challenge page URL for a Support ticket.
 *
 * @param challengeId opaque challenge identifier.
 * @returns absolute, safely encoded public challenge URL.
 * @throws Does not throw.
 */
export function buildSupportChallengeUrl(challengeId: string): string {
    const challengeBaseUrl = EnvironmentConfig.URLS.CHALLENGES_PAGE.replace(/\/$/, '')
    return `${challengeBaseUrl}/${encodeURIComponent(challengeId)}`
}

/**
 * Converts markdown to compact plain text without interpreting embedded HTML.
 *
 * @param markdown ticket markdown.
 * @returns normalized plain text for list previews.
 * @throws Does not throw.
 */
export function markdownToPlainText(markdown: string): string {
    return String(markdown || '')
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/<[^>]*>/g, ' ')
        .replace(/(^|\s)[#>*_~`-]+/g, '$1')
        .replace(/[*_~`]+/g, '')
        .replace(/\s+/g, ' ')
        .trim()
}

/**
 * Truncates text without exceeding the requested visible length.
 *
 * @param value plain text value.
 * @param maxLength maximum output length including the ellipsis.
 * @returns original text or a truncated value ending with an ellipsis.
 * @throws Does not throw.
 */
export function truncateText(value: string, maxLength: number = 150): string {
    if (value.length <= maxLength) {
        return value
    }

    return `${value.slice(0, Math.max(0, maxLength - 1))
        .trimEnd()}…`
}

/**
 * Sorts response copies from oldest to newest without mutating API data.
 *
 * @param responses support responses.
 * @returns a new ascending response array.
 * @throws Does not throw.
 */
export function sortResponsesAscending(responses: readonly SupportResponse[]): SupportResponse[] {
    return [...responses].sort(
        (left, right) => new Date(left.createdAt)
            .getTime()
            - new Date(right.createdAt)
                .getTime(),
    )
}

/**
 * Formats an ISO timestamp for the current browser locale.
 *
 * @param value ISO date/time.
 * @returns localized date/time, or an em dash when absent or invalid.
 * @throws Does not throw.
 */
export function formatSupportDate(value: string | undefined): string {
    if (!value) {
        return '—'
    }

    const date = new Date(value)
    return Number.isNaN(date.getTime())
        ? '—'
        : new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        })
            .format(date)
}

/**
 * Produces a safe user-facing message from a rejected request.
 *
 * @param error unknown request error.
 * @param fallback contextual fallback message.
 * @returns a safe error message.
 * @throws Does not throw.
 */
export function getSupportErrorMessage(error: unknown, fallback: string): string {
    const candidate = error as {
        message?: string
        response?: { data?: { message?: string }; status?: number }
        status?: number
    }
    const status = candidate?.status ?? candidate?.response?.status

    if (status === 401) return 'Your session has expired. Sign in again and retry.'
    if (status === 403) return 'You do not have permission to perform this support action.'
    if (status === 404) return 'This support ticket could not be found.'

    return candidate?.response?.data?.message || candidate?.message || fallback
}
