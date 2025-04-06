/**
 * Util for number
 */

/**
 * Round with 2 decimal places
 * @param num number
 * @returns result number
 */
export function roundWith2DecimalPlaces(num: number): number {
    return Math.round(num * 100) / 100
}

/**
 * Calculate file size in units
 * @param bytes file size in bytes
 * @param units units
 * @returns file size
 */
export function humanFileSize(inputBytes: number, units: string[]): string {
    let bytes = inputBytes
    if (Math.abs(bytes) < 1024) {
        return `${bytes}${units[0]}`
    }

    let u = 0
    do {
        bytes /= 1024
        u += 1
    } while (Math.abs(bytes) >= 1024 && u < units.length)

    return `${bytes.toFixed(1)}${units[u]}`
}
