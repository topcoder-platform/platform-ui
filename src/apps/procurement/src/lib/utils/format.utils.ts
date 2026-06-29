/**
 * One calendar day in milliseconds.
 */
const MS_PER_DAY: number = 86400000

const businessDatePattern: RegExp = /^(\d{4})-(\d{2})-(\d{2})/

interface BusinessDateParts {
    day: number
    month: number
    year: number
}

/**
 * Formats a backend timestamp for procurement tables using the user's local calendar.
 *
 * @param value Timestamp-like value from the API.
 * @returns Localized timestamp date label, an em dash fallback, or the original invalid value.
 */
export function formatDate(value?: string): string {
    if (!value) {
        return '-'
    }

    const date: Date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

/**
 * Formats contract, invoice, and renewal business dates without applying local timezone conversion.
 *
 * @param value Business date value from the API.
 * @returns Localized business-date label, an em dash fallback, or the original invalid value.
 */
export function formatBusinessDate(value?: string): string {
    if (!value) {
        return '-'
    }

    const dateParts: BusinessDateParts | undefined = parseBusinessDateParts(value)

    if (!dateParts) {
        return value
    }

    const date: Date = new Date(Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day))

    return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
        year: 'numeric',
    })
}

/**
 * Formats a number as USD for procurement money columns.
 *
 * @param value Money value from the API.
 * @returns Currency label.
 */
export function formatMoney(value?: number): string {
    return new Intl.NumberFormat('en-US', {
        currency: 'USD',
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
        style: 'currency',
    })
        .format(value || 0)
}

/**
 * Formats enum-like API values as readable labels.
 *
 * @param value API enum string.
 * @returns Human-readable label.
 */
export function formatStatusLabel(value?: string): string {
    if (!value) {
        return '-'
    }

    return value
        .split('_')
        .map((part: string) => `${part.charAt(0)
            .toUpperCase()}${part.slice(1)}`)
        .join(' ')
}

/**
 * Calculates a display-only day difference from today to a target business date.
 *
 * @param value Business date value from the API.
 * @returns Days-left label for urgent contract tables.
 */
export function formatDaysLeft(value?: string): string {
    if (!value) {
        return '-'
    }

    const dateParts: BusinessDateParts | undefined = parseBusinessDateParts(value)

    if (!dateParts) {
        return '-'
    }

    const today: Date = new Date()
    const startOfToday: number = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
    const startOfTarget: number = Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day)
    const days: number = Math.round((startOfTarget - startOfToday) / MS_PER_DAY)

    if (days < 0) {
        return `${Math.abs(days)} days overdue`
    }

    if (days === 0) {
        return 'Today'
    }

    return `${days} days`
}

/**
 * Parses an API business date by preserving its serialized calendar day.
 *
 * @param value Date-like value from the API.
 * @returns Business date parts when the value starts with a valid `YYYY-MM-DD` date.
 */
function parseBusinessDateParts(value: string): BusinessDateParts | undefined {
    const dateOnlyMatch: RegExpMatchArray | undefined = value.trim()
        .match(businessDatePattern) || undefined

    if (!dateOnlyMatch) {
        return undefined
    }

    const year: number = Number(dateOnlyMatch[1])
    const month: number = Number(dateOnlyMatch[2])
    const day: number = Number(dateOnlyMatch[3])
    const endOfMonthDay: number = new Date(Date.UTC(year, month, 0))
        .getUTCDate()

    if (month < 1 || month > 12 || day < 1 || day > endOfMonthDay) {
        return undefined
    }

    return {
        day,
        month,
        year,
    }
}

/**
 * Converts a backend date or timestamp to the value expected by date inputs.
 *
 * @param value Date-like value from the API.
 * @returns Date-only input value.
 */
export function toDateInputValue(value?: string): string {
    if (!value) {
        return ''
    }

    const dateOnlyMatch: RegExpMatchArray | undefined = value.match(/^\d{4}-\d{2}-\d{2}/) || undefined

    if (dateOnlyMatch) {
        return dateOnlyMatch[0]
    }

    const date: Date = new Date(value)

    return Number.isNaN(date.getTime())
        ? ''
        : date.toISOString()
            .slice(0, 10)
}
