/**
 * Shared member-facing date formatting for the Opportunities (Community) app.
 *
 * Every surface writes dates the same way: a numeric day, an abbreviated month,
 * a four-digit year, and — where a time is meaningful — a zero-padded 24-hour
 * clock, for example `17 Sep 2026, 14:39`. The abbreviated month keeps long
 * month names from wrapping inside the narrow rails (Topic info, Discussion
 * info, timeline milestones) and makes a column of dates quicker to scan.
 *
 * All values are rendered in the viewer's local timezone, matching the rest of
 * the challenge detail experience.
 */

/** Parts of a formatted timestamp, in the viewer's local timezone. */
interface DateParts {
    day: string
    hour: string
    minute: string
    month: string
    year: string
}

/**
 * Splits a timestamp into the display parts used by the formatters below.
 *
 * @param value ISO timestamp, or undefined.
 * @returns local day, abbreviated month, year, hour, and minute, or undefined when the value is unusable.
 * @throws Does not throw; unparseable values return undefined.
 */
function dateParts(value?: string): DateParts | undefined {
    if (!value) return undefined
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return undefined

    const parts = new Intl.DateTimeFormat('en-US', {
        day: 'numeric',
        hour: '2-digit',
        hour12: false,
        minute: '2-digit',
        month: 'short',
        year: 'numeric',
    })
        .formatToParts(date)
    const find = (type: Intl.DateTimeFormatPartTypes): string => (
        parts.find(part => part.type === type)?.value ?? ''
    )
    const result = {
        day: find('day'),
        // `hour12: false` renders midnight as 24 in some ICU builds.
        hour: find('hour') === '24' ? '00' : find('hour'),
        minute: find('minute'),
        month: find('month'),
        year: find('year'),
    }
    return Object.values(result)
        .every(Boolean) ? result : undefined
}

/**
 * Formats a timestamp as `17 Sep 2026`.
 *
 * @param value ISO timestamp, or undefined.
 * @param fallback text used when no usable date exists.
 * @returns the formatted date, or the supplied fallback.
 * @throws Does not throw.
 */
export function formatOpportunityDate(value: string | undefined, fallback: string): string {
    const parts = dateParts(value)
    return parts ? `${parts.day} ${parts.month} ${parts.year}` : fallback
}

/**
 * Formats a timestamp as `17 Sep 2026, 14:39`.
 *
 * @param value ISO timestamp, or undefined.
 * @param fallback text used when no usable date exists.
 * @returns the formatted date and local time, or the supplied fallback.
 * @throws Does not throw.
 */
export function formatOpportunityDateTime(value: string | undefined, fallback: string): string {
    const parts = dateParts(value)
    return parts
        ? `${parts.day} ${parts.month} ${parts.year}, ${parts.hour}:${parts.minute}`
        : fallback
}

/**
 * Formats a period as `14 Sep - 15 Sep 2026`, dropping the year from the start
 * when both ends fall in the same year.
 *
 * @param startValue ISO start timestamp, or undefined.
 * @param endValue ISO end timestamp, or undefined.
 * @param fallback text used when the start is missing or unusable.
 * @returns the formatted range, the start alone when no end exists, or the fallback.
 * @throws Does not throw.
 */
export function formatOpportunityDateRange(
    startValue: string | undefined,
    endValue: string | undefined,
    fallback: string,
): string {
    const start = dateParts(startValue)
    if (!start) return fallback

    const end = dateParts(endValue)
    if (!end) return `${start.day} ${start.month} ${start.year}`

    const startLabel = start.year === end.year
        ? `${start.day} ${start.month}`
        : `${start.day} ${start.month} ${start.year}`
    return `${startLabel} - ${end.day} ${end.month} ${end.year}`
}
