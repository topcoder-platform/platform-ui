const DAY_MILLISECONDS = 24 * 60 * 60 * 1000

/**
 * Converts an API UTC bound to the inclusive calendar date shown in a segment form.
 * @param value persisted ISO instant, or undefined for an unrestricted bound.
 * @param upper whether the API bound is an exclusive upper limit.
 * @returns YYYY-MM-DD, or an empty string for absent/invalid input.
 * @throws Does not throw; invalid persisted dates are displayed as empty.
 */
export function toSegmentDateInput(value: string | undefined, upper: boolean): string {
    if (!value) return ''
    const instant = Date.parse(value)
    if (!Number.isFinite(instant)) return ''
    return new Date(instant - (upper ? 1 : 0))
        .toISOString()
        .slice(0, 10)
}

/**
 * Converts an inclusive date selection into the API's inclusive lower or exclusive upper UTC instant.
 * @param value date input's YYYY-MM-DD value.
 * @param upper whether all instants on the selected date should fall before the resulting upper bound.
 * @returns midnight UTC, advanced one calendar day for an upper limit; undefined for absent/invalid input.
 * @throws Does not throw for a browser date input in the four-digit-year range.
 */
export function fromSegmentDateInput(value: string, upper: boolean): string | undefined {
    if (!value) return undefined
    const instant = Date.parse(`${value}T00:00:00.000Z`)
    if (!Number.isFinite(instant)) return undefined
    return new Date(instant + (upper ? DAY_MILLISECONDS : 0))
        .toISOString()
}
