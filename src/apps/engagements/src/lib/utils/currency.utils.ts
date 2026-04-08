const USD_CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: 'currency',
})

const DECIMAL_FORMATTER = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
})

/**
 * Parses positive numeric values used by engagement assignment terms.
 *
 * @param value Numeric input received from the API payload.
 * @returns Parsed positive number, or `undefined` when the value is absent or invalid.
 */
export const normalizePositiveNumericValue = (
    value?: string | number | null,
): number | undefined => {
    if (value === null || value === undefined) {
        return undefined
    }

    const normalized = typeof value === 'string' ? value.trim() : value.toString()
    if (!normalized) {
        return undefined
    }

    const parsed = Number(normalized)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

/**
 * Formats assignment currency values with a fixed two-decimal USD display.
 *
 * @param value Currency value received from the API payload.
 * @param fallback Label shown when the value is absent or invalid.
 * @returns Formatted USD currency string.
 */
export const formatCurrencyAmount = (
    value?: string | number | null,
    fallback = 'TBD',
): string => {
    const parsed = normalizePositiveNumericValue(value)

    if (parsed === undefined) {
        if (value === null || value === undefined) {
            return fallback
        }

        const normalized = typeof value === 'string' ? value.trim() : value.toString()
        return normalized ? `$${normalized}` : fallback
    }

    return USD_CURRENCY_FORMATTER.format(parsed)
}

/**
 * Formats fractional standard hours while preserving up to two decimals.
 *
 * @param value Standard hours per week received from the API payload.
 * @param fallback Label shown when the value is absent or invalid.
 * @returns Human-readable weekly hours label.
 */
export const formatStandardHoursPerWeek = (
    value?: string | number | null,
    fallback = 'TBD',
): string => {
    const parsed = normalizePositiveNumericValue(value)
    return parsed === undefined ? fallback : `${DECIMAL_FORMATTER.format(parsed)} hrs`
}
