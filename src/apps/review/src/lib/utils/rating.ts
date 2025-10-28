/**
 * Normalize rating values coming from various sources into a finite number.
 */
export function normalizeRatingValue(
    value: number | string | null | undefined,
): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value
    }

    if (typeof value === 'string') {
        const trimmed = value.trim()
        if (!trimmed.length) {
            return undefined
        }

        const parsed = Number.parseFloat(trimmed)
        return Number.isFinite(parsed) ? parsed : undefined
    }

    return undefined
}
