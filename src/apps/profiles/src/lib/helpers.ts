/**
 * Convert number to fixed digits string
 */
export function numberToFixed(value: number | string, digits: number = 2): string {
    const n: number = Number(value)

    return n ? n.toFixed(digits) : '0'
}
