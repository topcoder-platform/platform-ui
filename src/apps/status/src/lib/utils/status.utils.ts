/**
 * Pure formatting and ordering helpers for operational Status views.
 */
import { StatusSeverity } from '../models'

const SEVERITY_ORDER: Record<StatusSeverity, number> = {
    critical: 0,
    healthy: 4,
    'healthy-change': 3,
    unknown: 2,
    warning: 1,
}

/**
 * Sorts rows by canonical severity before applying an optional secondary sort.
 *
 * @param rows source rows to copy and order.
 * @param severity extracts the server-issued severity.
 * @param secondary orders rows only within one severity group.
 * @returns a sorted copy that can never put healthy rows above critical rows.
 * @throws Does not throw.
 */
export function sortBySeverity<T>(
    rows: readonly T[],
    severity: (row: T) => StatusSeverity,
    secondary?: (left: T, right: T) => number,
): T[] {
    return [...rows].sort((left, right) => {
        const severityDifference = SEVERITY_ORDER[severity(left)]
            - SEVERITY_ORDER[severity(right)]
        return severityDifference || secondary?.(left, right) || 0
    })
}

/**
 * Formats an API ratio as a percentage without manufacturing a zero value.
 *
 * @param ratio decimal ratio returned by the API, or null when unavailable.
 * @param digits number of fraction digits to show.
 * @returns a percentage string or an em dash for unavailable values.
 * @throws Does not throw.
 */
export function formatRatio(ratio: number | null | undefined, digits: number = 1): string {
    if (ratio === null || ratio === undefined || !Number.isFinite(ratio)) {
        return '—'
    }

    return `${(ratio * 100).toFixed(digits)}%`
}

/**
 * Formats a millisecond metric while retaining unavailable state.
 *
 * @param value millisecond value or null.
 * @returns a localized millisecond label or an em dash.
 * @throws Does not throw.
 */
export function formatLatency(value: number | null | undefined): string {
    return value === null || value === undefined || !Number.isFinite(value)
        ? '—'
        : `${Math.round(value)
            .toLocaleString()} ms`
}

/**
 * Formats bytes using binary units for RDS storage values.
 *
 * @param bytes byte count or null when unavailable.
 * @returns compact binary-unit label or an em dash.
 * @throws Does not throw.
 */
export function formatBytes(bytes: number | null | undefined): string {
    if (bytes === null || bytes === undefined || !Number.isFinite(bytes)) {
        return '—'
    }

    if (bytes === 0) {
        return '0 B'
    }

    const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB']
    const unitIndex = Math.min(
        Math.floor(Math.log(Math.abs(bytes)) / Math.log(1024)),
        units.length - 1,
    )
    const normalized = bytes / (1024 ** unitIndex)
    return `${normalized.toFixed(unitIndex > 2 ? 1 : 0)} ${units[unitIndex]}`
}

/**
 * Formats an ISO timestamp in the administrator's locale.
 *
 * @param value ISO timestamp or null.
 * @returns localized date/time or an em dash for missing/invalid input.
 * @throws Does not throw.
 */
export function formatTimestamp(value: string | null | undefined): string {
    if (!value) {
        return '—'
    }

    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
}

/**
 * Joins safe server-issued reasons for compact table display.
 *
 * @param reasons severity or failure reason strings.
 * @returns visible reason text, falling back to a neutral explanation.
 * @throws Does not throw.
 */
export function formatReasons(reasons: string[] | undefined): string {
    return reasons?.filter(Boolean)
        .join('; ') || 'No current issue reported'
}
