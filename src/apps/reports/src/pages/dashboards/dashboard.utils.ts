const DASHBOARD_PERIOD_MONTHS = 6
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const MONTH_LABELS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
] as const

const compactIntegerFormatter = new Intl.NumberFormat('en-US', {
    compactDisplay: 'short',
    maximumFractionDigits: 1,
    notation: 'compact',
})

const percentageFormatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
})

/**
 * UTC date range used by dashboard requests.
 *
 * `startDate` is inclusive and `endDate` is exclusive. Both values use the
 * `YYYY-MM-DD` ISO date format so the same range can be sent to the API and CSV
 * export endpoints without local-time conversion.
 */
export interface DashboardRange {
    endDate: string
    startDate: string
}

/**
 * Creates a new UTC month-start date a number of calendar months away.
 *
 * @param date UTC date whose year and month anchor the calculation.
 * @param monthOffset Number of calendar months to add or subtract.
 * @returns A new date at midnight UTC on the first day of the resulting month.
 * @throws RangeError when the supplied date is invalid or the offset is not an integer.
 *
 * This helper is used by dashboard period calculations so month lengths and
 * leap years never affect navigation between six-month reporting blocks.
 */
function addUtcMonths(date: Date, monthOffset: number): Date {
    if (Number.isNaN(date.getTime())) {
        throw new RangeError('Dashboard date must be valid.')
    }

    if (!Number.isInteger(monthOffset)) {
        throw new RangeError('Dashboard month offset must be an integer.')
    }

    return new Date(Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth() + monthOffset,
        1,
    ))
}

/**
 * Converts a valid date to the API's UTC ISO date representation.
 *
 * @param date Date to serialize.
 * @returns The UTC calendar date in `YYYY-MM-DD` format.
 * @throws RangeError when the supplied date is invalid.
 *
 * Dashboard range and filename builders use this helper to avoid locale-specific
 * or timezone-specific serialization.
 */
function toIsoDate(date: Date): string {
    if (Number.isNaN(date.getTime())) {
        throw new RangeError('Dashboard date must be valid.')
    }

    return date.toISOString()
        .slice(0, 10)
}

/**
 * Parses and validates an API dashboard date without applying a local timezone.
 *
 * @param isoDate API date in exact `YYYY-MM-DD` format.
 * @returns A date at midnight UTC for the supplied calendar date.
 * @throws RangeError when the value is not a real ISO calendar date.
 *
 * Range labels and filenames use this stricter parser to keep dashboard request
 * boundaries explicit and stable.
 */
function parseDashboardIsoDate(isoDate: string): Date {
    const match = ISO_DATE_PATTERN.exec(isoDate)

    if (!match) {
        throw new RangeError('Dashboard range dates must use YYYY-MM-DD format.')
    }

    const [, year, month, day] = match
    const parsed = new Date(Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
    ))

    if (toIsoDate(parsed) !== isoDate) {
        throw new RangeError('Dashboard range dates must be valid calendar dates.')
    }

    return parsed
}

/**
 * Resolves a date-like value for a UTC dashboard month label.
 *
 * @param value ISO date/time string or Date instance returned by dashboard data.
 * @returns A cloned, valid Date instance.
 * @throws RangeError when the value cannot be parsed as a date.
 *
 * Chart axes and range headings use the resolved date's UTC month and year.
 */
function parseDashboardDate(value: string | Date): Date {
    const parsed = value instanceof Date
        ? new Date(value.getTime())
        : new Date(value)

    if (Number.isNaN(parsed.getTime())) {
        throw new RangeError('Dashboard month must be a valid date.')
    }

    return parsed
}

/**
 * Validates that a numeric dashboard value can be formatted.
 *
 * @param value Numeric metric supplied by a dashboard response.
 * @param label Human-readable metric name used in the validation error.
 * @returns The validated finite number.
 * @throws RangeError when the value is NaN or infinite.
 *
 * Number and percentage formatters share this validation to avoid rendering
 * browser-dependent strings such as `NaN`.
 */
function requireFiniteNumber(value: number, label: string): number {
    if (!Number.isFinite(value)) {
        throw new RangeError(`${label} must be a finite number.`)
    }

    return value
}

/**
 * Normalizes a dashboard slug for a stable browser download filename.
 *
 * @param dashboardSlug Route or API slug identifying the dashboard.
 * @returns A lowercase, hyphen-separated filename segment.
 * @throws RangeError when the slug contains no letters or numbers.
 *
 * CSV downloads use this normalization so display text and route-safe slugs
 * produce the same predictable filename shape.
 */
function normalizeDashboardSlug(dashboardSlug: string): string {
    const normalized = dashboardSlug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

    if (normalized === 'all') {
        return 'reports-dashboards'
    }

    if (!normalized) {
        throw new RangeError('Dashboard slug must contain a letter or number.')
    }

    return normalized
}

/**
 * Builds a UTC-safe six-calendar-month dashboard request range.
 *
 * @param periodOffset Six-month block offset from the latest period. `0`
 * includes the current UTC month, while `-1` returns the immediately preceding
 * six-month block.
 * @param referenceDate Date used to identify the current UTC month. Dashboard
 * pages normally omit it; tests and deterministic callers may supply it.
 * @returns Inclusive `startDate` and exclusive `endDate` in `YYYY-MM-DD` format.
 * @throws RangeError when the reference date is invalid or the offset is not an integer.
 *
 * Landing and detail dashboards use this range for data requests, period
 * navigation, and matching CSV exports.
 */
export function getDashboardRange(
    periodOffset: number = 0,
    referenceDate: Date = new Date(),
): DashboardRange {
    if (Number.isNaN(referenceDate.getTime())) {
        throw new RangeError('Dashboard reference date must be valid.')
    }

    if (!Number.isInteger(periodOffset)) {
        throw new RangeError('Dashboard period offset must be an integer.')
    }

    const currentMonthStart = new Date(Date.UTC(
        referenceDate.getUTCFullYear(),
        referenceDate.getUTCMonth(),
        1,
    ))
    const latestRangeEnd = addUtcMonths(currentMonthStart, 1)
    const endDate = addUtcMonths(
        latestRangeEnd,
        periodOffset * DASHBOARD_PERIOD_MONTHS,
    )
    const startDate = addUtcMonths(endDate, -DASHBOARD_PERIOD_MONTHS)

    return {
        endDate: toIsoDate(endDate),
        startDate: toIsoDate(startDate),
    }
}

/**
 * Formats a dashboard date as an abbreviated UTC month and two-digit year.
 *
 * @param value ISO date/time string or Date instance for a chart month.
 * @returns A stable English label such as `Jul ’26`.
 * @throws RangeError when the value is not a valid date.
 *
 * Compact and detailed charts use this formatter for matching axis labels.
 */
export function formatDashboardMonth(value: string | Date): string {
    const date = parseDashboardDate(value)
    const month = MONTH_LABELS[date.getUTCMonth()]
    const year = String(date.getUTCFullYear())
        .slice(-2)

    return `${month} \u2019${year}`
}

/**
 * Formats an exclusive dashboard range as its inclusive display months.
 *
 * @param range Dashboard API range with inclusive start and exclusive end dates.
 * @returns A range label such as `Feb ’26 – Jul ’26`.
 * @throws RangeError when either date is invalid or the end is not after the start.
 *
 * Dashboard headings use this label while requests retain their precise,
 * exclusive `endDate` boundary.
 */
export function formatDashboardRangeLabel(range: DashboardRange): string {
    const startDate = parseDashboardIsoDate(range.startDate)
    const endDate = parseDashboardIsoDate(range.endDate)

    if (endDate.getTime() <= startDate.getTime()) {
        throw new RangeError('Dashboard range end date must be after its start date.')
    }

    const finalIncludedMonth = addUtcMonths(endDate, -1)

    return `${formatDashboardMonth(startDate)} \u2013 ${formatDashboardMonth(finalIncludedMonth)}`
}

/**
 * Formats an integer dashboard metric using compact English notation.
 *
 * @param value Numeric count to round and abbreviate.
 * @returns A compact label such as `18.2K` or `2M`.
 * @throws RangeError when the value is NaN or infinite.
 *
 * Dashboard chart axes and space-constrained cards use this formatter; full
 * metric cards may continue to use localized full counts.
 */
export function formatCompactInteger(value: number): string {
    const integerValue = Math.round(requireFiniteNumber(value, 'Dashboard count'))

    return compactIntegerFormatter.format(integerValue)
}

/**
 * Formats dashboard percentage points with at most one decimal place.
 *
 * @param percentage Percentage value on a zero-to-one-hundred scale, such as
 * `72.7` for seventy-two point seven percent.
 * @returns A label such as `72.7%`.
 * @throws RangeError when the value is NaN or infinite.
 *
 * Dashboard summary cards use this helper for API fields such as activation
 * and submission rates.
 */
export function formatPercentage(percentage: number): string {
    const validatedPercentage = requireFiniteNumber(percentage, 'Dashboard percentage')

    return `${percentageFormatter.format(validatedPercentage)}%`
}

/**
 * Builds a stable CSV filename for one dashboard and request range.
 *
 * @param dashboardSlug Route or API slug identifying the dashboard.
 * Pass `all` for the landing-page aggregate export.
 * @param range Dashboard request range with an exclusive `endDate`.
 * @returns A normalized filename such as
 * `new-signups-2026-02-01-to-2026-08-01.csv`. The `all` slug produces a
 * `reports-dashboards-...csv` filename.
 * @throws RangeError when the slug or range dates are invalid, or the range is empty.
 *
 * Detail dashboard downloads use the filename alongside the same date range
 * supplied to the CSV endpoint.
 */
export function buildDashboardCsvFileName(
    dashboardSlug: string,
    range: DashboardRange,
): string {
    formatDashboardRangeLabel(range)

    return [
        normalizeDashboardSlug(dashboardSlug),
        range.startDate,
        'to',
        range.endDate,
    ].join('-')
        .concat('.csv')
}
