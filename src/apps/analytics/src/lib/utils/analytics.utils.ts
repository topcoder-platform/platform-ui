import { AnalyticsDateRange } from '../models'

const integerFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const calendarDateFormatter = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeZone: 'UTC',
})
const timestampFormatter = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
})

/**
 * Returns the default inclusive 30-day analytics range in UTC.
 *
 * @param reference optional reference timestamp, primarily for deterministic tests.
 * @returns YYYY-MM-DD from/to values.
 * @throws Does not throw.
 */
export function defaultAnalyticsDateRange(reference: Date = new Date()): AnalyticsDateRange {
    const end = new Date(Date.UTC(
        reference.getUTCFullYear(),
        reference.getUTCMonth(),
        reference.getUTCDate(),
    ))
    const start = new Date(end)
    start.setUTCDate(start.getUTCDate() - 29)
    return {
        from: start.toISOString()
            .slice(0, 10),
        to: end.toISOString()
            .slice(0, 10),
    }
}

/**
 * Validates the UI's inclusive analytics date range before requesting the API.
 *
 * @param range candidate from/to values.
 * @param reference optional current timestamp, primarily for deterministic tests.
 * @returns validation message or undefined when the range is valid and at most 366 days.
 * @throws Does not throw.
 */
export function validateAnalyticsDateRange(
    range: AnalyticsDateRange,
    reference: Date = new Date(),
): string | undefined {
    const from = parseIsoDate(range.from)
    const to = parseIsoDate(range.to)
    if (!from || !to) return 'Choose a valid start and end date.'
    if (from.getTime() > to.getTime()) return 'The start date must not be after the end date.'
    const today = Date.UTC(
        reference.getUTCFullYear(),
        reference.getUTCMonth(),
        reference.getUTCDate(),
    )
    if (to.getTime() > today) return 'The end date must not be in the future.'
    const days = Math.floor((to.getTime() - from.getTime()) / 86_400_000) + 1
    return days > 366 ? 'Analytics date ranges cannot exceed 366 days.' : undefined
}

/**
 * Formats an aggregate count with locale separators.
 *
 * @param value finite aggregate count.
 * @returns formatted integer string.
 * @throws Does not throw.
 */
export function formatAnalyticsInteger(value: number): string {
    return integerFormatter.format(Number.isFinite(value) ? value : 0)
}

/**
 * Formats a conversion percentage to at most two decimal places.
 *
 * @param value finite percent value.
 * @returns percent string including the percent sign.
 * @throws Does not throw.
 */
export function formatAnalyticsPercent(value: number): string {
    const safeValue = Number.isFinite(value) ? value : 0
    return `${safeValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}%`
}

/**
 * Formats API freshness metadata in the viewer's local timezone.
 *
 * @param value ISO timestamp, YYYY-MM-DD, or absent value.
 * @returns display label or "Not available".
 * @throws Does not throw for malformed inputs.
 */
export function formatAnalyticsFreshness(value?: string): string {
    if (!value) return 'Not available'
    const isCalendarDate = /^\d{4}-\d{2}-\d{2}$/.test(value)
    const candidate = isCalendarDate ? `${value}T00:00:00Z` : value
    const parsed = new Date(candidate)
    if (Number.isNaN(parsed.getTime())) return value
    return isCalendarDate
        ? calendarDateFormatter.format(parsed)
        : timestampFormatter.format(parsed)
}

/**
 * Converts a safe internal surface identifier into a readable label.
 *
 * @param value analytics surface identifier.
 * @returns title-cased label.
 * @throws Does not throw.
 */
export function formatAnalyticsSurface(value: string): string {
    return value
        .split('_')
        .filter(Boolean)
        .map(part => `${part.charAt(0)
            .toUpperCase()}${part.slice(1)}`)
        .join(' ') || 'Unknown'
}

/**
 * Builds a stable request identity from applied report filters.
 *
 * @param prefix report type.
 * @param filters scalar applied filters.
 * @returns stable key suitable for a request hook dependency.
 * @throws Does not throw.
 */
export function analyticsRequestKey(
    prefix: string,
    filters: AnalyticsDateRange,
): string {
    return `${prefix}:${Object.entries(filters)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, value]) => `${key}=${value ?? ''}`)
        .join('&')}`
}

/**
 * Parses a strict calendar date at UTC midnight.
 *
 * @param value YYYY-MM-DD input.
 * @returns valid Date or undefined.
 * @throws Does not throw.
 */
function parseIsoDate(value: string): Date | undefined {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
    const parsed = new Date(`${value}T00:00:00Z`)
    return Number.isNaN(parsed.getTime()) || parsed.toISOString()
        .slice(0, 10) !== value
        ? undefined
        : parsed
}
