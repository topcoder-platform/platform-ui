const ASSIGNMENT_CANONICAL_UTC_HOUR = 12
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

function createLocalAssignmentDate(
    year: number,
    month: number,
    day: number,
): Date {
    return new Date(
        year,
        month,
        day,
        ASSIGNMENT_CANONICAL_UTC_HOUR,
        0,
        0,
        0,
    )
}

export function serializeTentativeAssignmentDate(
    value: Date | string | undefined | null,
): string {
    if (!value) {
        return ''
    }

    const dateValue = value instanceof Date
        ? value
        : new Date(value)

    if (Number.isNaN(dateValue.getTime())) {
        return ''
    }

    const year = dateValue.getFullYear()
    const month = dateValue.getMonth()
    const day = dateValue.getDate()

    return new Date(Date.UTC(
        year,
        month,
        day,
        ASSIGNMENT_CANONICAL_UTC_HOUR,
        0,
        0,
        0,
    ))
        .toISOString()
}

/**
 * Converts a stored assignment date into a DateInput-friendly local Date value.
 *
 * @param value assignment date from persisted state or API data.
 * @returns local Date when parsing succeeds; otherwise `undefined`.
 */
export function deserializeTentativeAssignmentDate(
    value: Date | string | undefined | null,
): Date | undefined {
    if (!value) {
        return undefined
    }

    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) {
            return undefined
        }

        return createLocalAssignmentDate(
            value.getFullYear(),
            value.getMonth(),
            value.getDate(),
        )
    }

    const parsedDate = new Date(value)

    if (Number.isNaN(parsedDate.getTime())) {
        return undefined
    }

    return createLocalAssignmentDate(
        parsedDate.getUTCFullYear(),
        parsedDate.getUTCMonth(),
        parsedDate.getUTCDate(),
    )
}

/**
 * Converts a date to a UTC date-only timestamp at midnight.
 *
 * @param date date to normalize.
 * @returns milliseconds at UTC midnight for the same calendar date.
 */
function getUtcDateOnlyTime(date: Date): number {
    return Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
    )
}

/**
 * Calculates remaining whole days in an assignment engagement from billing
 * start date plus duration in months. Ended engagements return `0`.
 *
 * @param startDate billing start date.
 * @param durationMonths assignment duration in months.
 * @param now optional "today" override for tests.
 * @returns non-negative remaining days, or `undefined` when inputs are incomplete.
 */
export function getAssignmentDaysLeftInEngagement(
    startDate?: Date | string | null,
    durationMonths?: number | string | null,
    now: Date = new Date(),
): number | undefined {
    if (!startDate || durationMonths === undefined || durationMonths === null || durationMonths === '') {
        return undefined
    }

    const parsedStartDate = startDate instanceof Date
        ? startDate
        : new Date(startDate)
    const parsedDurationMonths = Number(durationMonths)

    if (
        Number.isNaN(parsedStartDate.getTime())
        || !Number.isFinite(parsedDurationMonths)
        || parsedDurationMonths <= 0
        || !Number.isInteger(parsedDurationMonths)
    ) {
        return undefined
    }

    const resolvedEndDate = new Date(parsedStartDate.getTime())
    resolvedEndDate.setUTCMonth(resolvedEndDate.getUTCMonth() + parsedDurationMonths)

    const daysLeft = Math.round(
        (getUtcDateOnlyTime(resolvedEndDate) - getUtcDateOnlyTime(now))
            / MILLISECONDS_PER_DAY,
    )

    return Math.max(0, daysLeft)
}

/**
 * Formats remaining engagement days for Assignments list display.
 *
 * Cancelled, completed, and terminated assignments show `N/A`.
 *
 * @param startDate billing start date.
 * @param durationMonths assignment duration in months.
 * @param status optional assignment status.
 * @param now optional "today" override for tests.
 * @returns display string such as `16 days`, `N/A`, or `-` when unavailable.
 */
export function formatAssignmentDaysLeftInEngagement(
    startDate?: Date | string | null,
    durationMonths?: number | string | null,
    status?: string | null,
    now: Date = new Date(),
): string {
    const normalizedStatus = String(status || '')
        .trim()
        .toUpperCase()
        .replace(/[\s-]+/g, '_')

    if (
        normalizedStatus === 'CANCELLED'
        || normalizedStatus === 'COMPLETED'
        || normalizedStatus === 'TERMINATED'
    ) {
        return 'N/A'
    }

    const daysLeft = getAssignmentDaysLeftInEngagement(startDate, durationMonths, now)

    if (daysLeft === undefined) {
        return '-'
    }

    return `${daysLeft} day${daysLeft === 1 ? '' : 's'}`
}
