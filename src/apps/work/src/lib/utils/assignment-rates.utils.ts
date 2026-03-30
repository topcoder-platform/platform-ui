const currencyFormatter = new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: 'currency',
})

/**
 * Parses a positive numeric input value.
 *
 * @param value input value from assignment forms.
 * @returns parsed positive number, or `undefined` when the value is empty or invalid.
 */
export function toPositiveNumber(value: unknown): number | undefined {
    if (value === '' || value === null || value === undefined) {
        return undefined
    }

    const parsed = Number(value)

    return Number.isFinite(parsed) && parsed > 0
        ? parsed
        : undefined
}

/**
 * Parses a positive integer input value.
 *
 * @param value input value from assignment forms.
 * @returns parsed positive integer, or `undefined` when the value is empty or invalid.
 */
export function toPositiveInteger(value: unknown): number | undefined {
    const parsed = toPositiveNumber(value)

    return Number.isInteger(parsed)
        ? parsed
        : undefined
}

/**
 * Parses a positive numeric input value that may include at most the supplied
 * number of decimal places.
 *
 * @param value input value from assignment forms.
 * @param maxDecimalPlaces maximum supported decimal places.
 * @returns parsed positive number, or `undefined` when the value is empty,
 * invalid, or exceeds the supported precision.
 */
export function toPositiveNumberWithMaxDecimalPlaces(
    value: unknown,
    maxDecimalPlaces: number,
): number | undefined {
    const parsed = toPositiveNumber(value)

    if (parsed === undefined) {
        return undefined
    }

    const normalized = typeof value === 'string'
        ? value.trim()
        : String(value)

    if (!normalized || /e/i.test(normalized)) {
        return undefined
    }

    const [, decimalPart = ''] = normalized
        .replace(/^\+/, '')
        .split('.')

    return decimalPart.length <= maxDecimalPlaces
        ? parsed
        : undefined
}

/**
 * Removes non-numeric characters from assignment form input while preserving a
 * single decimal separator.
 *
 * @param value raw input field value.
 * @param maxDecimalPlaces optional decimal precision limit applied to the sanitized decimal part.
 * @returns sanitized numeric string suitable for controlled inputs.
 */
export function sanitizePositiveNumericInput(
    value: unknown,
    maxDecimalPlaces?: number,
): string {
    if (value === null || value === undefined) {
        return ''
    }

    const numericValue = String(value)
        .replace(/[^0-9.]/g, '')
    const firstDecimalIndex = numericValue.indexOf('.')

    if (firstDecimalIndex === -1) {
        return numericValue
    }

    const decimalPart = numericValue
        .slice(firstDecimalIndex + 1)
        .replace(/\./g, '')
    const truncatedDecimalPart = maxDecimalPlaces === undefined
        ? decimalPart
        : decimalPart.slice(0, maxDecimalPlaces)

    return `${numericValue.slice(0, firstDecimalIndex + 1)}${truncatedDecimalPart}`
}

/**
 * Calculates the assignment rate per week from hourly rate and standard hours.
 *
 * @param ratePerHour hourly assignment rate.
 * @param standardHoursPerWeek weekly standard hours.
 * @returns weekly assignment rate with two decimal places, or an empty string
 * when the inputs are incomplete or invalid.
 */
export function calculateAssignmentRatePerWeek(
    ratePerHour: unknown,
    standardHoursPerWeek: unknown,
): string {
    const parsedRatePerHour = toPositiveNumber(ratePerHour)
    const parsedStandardHoursPerWeek = toPositiveNumberWithMaxDecimalPlaces(
        standardHoursPerWeek,
        2,
    )

    if (parsedRatePerHour === undefined || parsedStandardHoursPerWeek === undefined) {
        return ''
    }

    return (parsedRatePerHour * parsedStandardHoursPerWeek).toFixed(2)
}

/**
 * Formats assignment currency values with two decimal places.
 *
 * @param value currency value to display.
 * @returns USD currency string, or an empty string when the value is missing
 * or invalid.
 */
export function formatAssignmentCurrency(value: unknown): string {
    if (value === null || value === undefined || value === '') {
        return ''
    }

    const parsed = Number(value)

    if (!Number.isFinite(parsed)) {
        return String(value)
    }

    return currencyFormatter.format(parsed)
}
